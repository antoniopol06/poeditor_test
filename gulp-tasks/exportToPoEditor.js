'use strict';

var gulp = require('gulp');

var process = require('process');

var request = require('request');

function errorHandler(err) {
    console.error(err.toString());
    this.emit('end');
}

gulp.task('export-to-poeditor', function (callback) {

    if (!process.env.POEDITOR_API_KEY || !process.env.POEDITOR_PROJECT_ID) {
        errorHandler(new Error('POEDITOR_API_KEY and POEDITOR_PROJECT_ID environment variables need to be set'));
        return;
    }

    var lang = 'en';

    var url = 'https://poeditor.com/api/webhooks/github?api_token=' + process.env.POEDITOR_API_KEY + '&id_project=' +
        process.env.POEDITOR_PROJECT_ID + '&language=' + lang + '&operation=import_terms_and_translations&overwrite_translations=1';

    request
        .get(url)
        .on('response', function() {
            console.log('english exported');
        });
});
