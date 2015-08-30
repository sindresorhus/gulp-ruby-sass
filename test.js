'use strict';

var fs = require('fs');
var sass = require('./');
var path = require('path');
var assert = require('assert');
var convert = require('convert-source-map');
var sourcemaps = require('gulp-sourcemaps');

var expectedSources = [
	'_obj-1.scss,_partial-1.scss,component/_obj-2.scss,fixture-a.scss',
	'_partial-1.scss,component/_obj-2.scss,nested/fixture-b.scss'
];

var expectedFixtureAContents = fs.readFileSync('fixture/result/fixture-a.css', {encoding: 'utf8'});
var expectedFixtureBContents = fs.readFileSync('fixture/result/nested/fixture-b.css', {encoding: 'utf8'});

function getCssFiles (files) {
	return files.filter(function (file) {
		return path.extname(file.path) === '.css';
	});
}

function getErrorFiles (files) {
	return files.filter(function (file) {
		return /Error: File to import not found or unreadable/.test(file.contents.toString());
	});
}

function getSourceMapFiles (files) {
	return files.filter(function (file) {
		return path.extname(file.path) === '.map';
	});
}

function getValidCssFiles (files) {
	return rejectFromArray(getCssFiles(files), getErrorFiles(files));
}

function rejectFromArray (baseArray, rejectArray) {
	return baseArray.filter(function (value) {
		return rejectArray.indexOf(value) === -1
	});
}
