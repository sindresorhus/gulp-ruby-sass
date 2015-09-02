'use strict';
var path = require('path');
var md5Hex = require('md5-hex');
var gutil = require('gulp-util');

var utils = {};

utils.emitErr = function (stream, err) {
	stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
};

// create temporary directory path for a specific task using cwd and source
utils.uniqueIntermediateDirectory = function (tempDir, source) {
	return path.join(
		tempDir,
		'gulp-ruby-sass',
		'cwd-' + md5Hex(process.cwd()) + '-source-' + md5Hex(source)
	);
};

utils.replaceLocation = function (origPath, currentLoc, newLoc) {
	return path.join(
		newLoc,
		path.relative(currentLoc, origPath)
	);
};

module.exports = utils;
