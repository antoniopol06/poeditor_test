'use strict';

var gulp = require('gulp');
var process = require('process');
var request = require('request');
var fs = require('fs');
var path = require('path');

var rootDir = path.join(__dirname);
var langDir = path.join(rootDir);

var baseUrl = 'https://api.poeditor.com/v2/';
var exportProjectUrl = baseUrl + 'projects/export';
var listLanguagesUrl = baseUrl + 'languages/list';

function errorHandler(err) {
    console.error(err.toString());
    this.emit('end');
}

function exportProject(code) {
    return new Promise(function (resolve, reject) {
        request.post({
            url: exportProjectUrl,
            form: {
                api_token: process.env.POEDITOR_API_KEY,
                id:  process.env.POEDITOR_PROJECT_ID,
                language: code,
                type: 'properties'
            }
        }, function (err, resp, body) {
            if (err) {
                reject(err);
                return;
            }
            var data = JSON.parse(body);
            resolve(data.result.url);
        });
    });
}

function downloadFile(url) {
    return new Promise(function (resolve, reject) {
        request.get(url, function (err, resp, body) {
            if (err) {
                reject(err);
                return;
            }
            resolve(body);
        });
    });
}

function writeFile(name, contents) {
    return new Promise(function (resolve, reject) {
        var filepath = path.join(rootDir,'..', name + '.properties');
        fs.writeFile(filepath, contents, function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(filepath);
        });
    });
}

gulp.task('generate-languages', function (callback) {

    if (!process.env.POEDITOR_API_KEY || !process.env.POEDITOR_PROJECT_ID) {
        errorHandler(new Error('POEDITOR_API_KEY and POEDITOR_PROJECT_ID environment variables need to be set'));
        return;
    }

    request.post({
        url: listLanguagesUrl,
        form: {
            api_token: process.env.POEDITOR_API_KEY,
            id: process.env.POEDITOR_PROJECT_ID
        }
    }, function (err, resp, body) {
        if (err) {
            errorHandler(err);
            return;
        }
        var data = JSON.parse(body);
        if (!data.result || !data.result.languages) {
            errorHandler(new Error('no languages found'));
            return;
        }

        var languages = data.result.languages;

        var urlMap = {};
        languages.map(function (lang) {
            urlMap[lang.code] = {
                downloadUrl: exportProject(lang.code),
                fileContents: null
            };
        });

        var urlKeys = Object.keys(urlMap);

        var contentPromises = urlKeys.map(function (key) {
            var lang = urlMap[key];

            return lang.downloadUrl.then(function (url) {
                return downloadFile(url).then(function (value) {
                    lang.fileContents = value;
                    return lang.fileContents;
                });
            });
        });


        Promise.all(contentPromises).then(function (data) {
            var keys = Object.keys(urlMap);
            var filePromises = [];
            for (var i = 0, l = keys.length; i < l; i += 1) {
                filePromises.push(writeFile(keys[i], urlMap[keys[i]].fileContents));
            }

            Promise.all(filePromises).then(function (data) {
                callback();
            }).catch(function (err) {
                errorHandler(err);
            });
        }).catch(function (err) {
            errorHandler(err);
        });
    });
});
