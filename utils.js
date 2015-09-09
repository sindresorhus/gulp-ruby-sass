'use strict';
var path = require('path');
var glob = require('glob');
var glob2base = require('glob2base');
var gutil = require('gulp-util');
var md5Hex = require('md5-hex');

var utils = {};

utils.emitErr = function (stream, err) {
	stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
};

// Create unique temporary directory path per task using cwd, options, sources,
// and all matched files. Options must be checked in case the user is switching
// tempDir or sourcemaps on or off. Sourcemap may be a bug; See
// https://github.com/sass/sass/issues/1830
utils.uniqueIntermediateDirectory = function (sources, matches, options) {
	return path.join(
		options.tempDir,
		'gulp-ruby-sass',
		md5Hex(
			process.cwd() +
			JSON.stringify(sources) +
			JSON.stringify(matches) +
			options.sourcemap
		)
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
