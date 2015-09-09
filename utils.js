'use strict';
var path = require('path');
var glob = require('glob');
var md5Hex = require('md5-hex');
var gutil = require('gulp-util');
var glob2base = require('glob2base');

var utils = {};

utils.emitErr = function (stream, err) {
	stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
};

// create temporary directory path for a specific task using cwd and sources
utils.uniqueIntermediateDirectory = function (tempDir, sources) {
	return path.join(
		tempDir,
		'gulp-ruby-sass',
		'cwd-' + md5Hex(process.cwd()) + '-sources-' + md5Hex(JSON.stringify(sources))
	);
};

utils.calculateBase = function (source) {
	return glob2base(new glob.Glob(source));
};

utils.replaceLocation = function (origPath, currentLoc, newLoc) {
	return path.join(
		newLoc,
		path.relative(currentLoc, origPath)
	);
};

module.exports = utils;
