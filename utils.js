'use strict';
var path = require('path');
var md5Hex = require('md5-hex');
var gutil = require('gulp-util');

var utils = {};

utils.emitErr = function (stream, err) {
	stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
};

utils.cacheDirectory = function (tempDir) {
	return path.join(tempDir, 'gulp-ruby-sass');
};

utils.uniqueIntermediateDirectory = function (tempDir, source) {
	return path.join(
		utils.cacheDirectory(tempDir),
		'cwd-' + md5Hex(process.cwd()) + '-source-' + md5Hex(source)
	);
};

module.exports = utils;
