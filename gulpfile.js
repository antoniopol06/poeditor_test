'use strict';

var gulp = require('gulp');

var	path = require('path');

var requireDir = require('require-dir');

requireDir('gulp-tasks');

gulp.task('default', function () { console.log('Gulp') });