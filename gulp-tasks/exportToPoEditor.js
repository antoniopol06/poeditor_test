'use strict';

var gulp = require('gulp');

var process = require('process');

var request = require('request');

var path = require('path');

var fs = require('fs');

function errorHandler(err) {
    console.error(err.toString());
    this.emit('end');
}

var baseUrl = 'https://api.poeditor.com/v2/';
var uploadProjectUrl = baseUrl + 'projects/upload';
var listLanguagesUrl = baseUrl + 'languages/list';
var rootDir = path.join(__dirname);

function uploadFile(code) {
    console.log(path.join(rootDir, '..', code + '.properties'));
    return new Promise(function (resolve, reject) {
        // var req = request.post({
        //     url: uploadProjectUrl,
        //     form: {
        //         api_token: process.env.POEDITOR_API_KEY,
        //         id:  process.env.POEDITOR_PROJECT_ID,
        //         updating: 'terms_translations',
        //         file: rootDir + '/' + code + '.properties',
        //         file: 'properties',
        //         language: code
        //     }
        // }, function (err, resp, body) {
        //     if (err) {
        //         reject(err);
        //         return;
        //     }
        //     var data = JSON.parse(body);
        //     resolve(data);
        // });

        function callback(err, resp, body) {
            if (err) {
                reject(err);
                return;
            }

            var data = JSON.parse(body);
            resolve(data);
        }

        var req = request.post(uploadProjectUrl, callback);

        var form = req.form();
        form.append('api_token', process.env.POEDITOR_API_KEY);
        form.append('id', process.env.POEDITOR_PROJECT_ID);
        form.append('updating', 'terms_translations');
        form.append('file', fs.createReadStream(path.join(rootDir, '..', code + '.properties')));
        form.append('language', code);
        form.append('overwrite', 1);
        form.append('sync_terms', 1);
    });
}


gulp.task('upload-languages', function (callback) {

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
                uploadFile: uploadFile(lang.code),
                fileContents: null
            };
        });

        var urlKeys = Object.keys(urlMap);

        var contentPromises = urlKeys.map(function (key) {
            var lang = urlMap[key];

            return lang.uploadFile.then(function (data) {
                console.log(data);
            });
        });


        Promise.all(contentPromises).then(function (data) {
            console.log(data);
        }).catch(function (err) {
            errorHandler(err);
        });
    });
});




