'use strict';

var gulp = require('gulp');

var process = require('process');

var request = require('request');

function errorHandler(err) {
    console.error(err.toString());
    this.emit('end');
}




