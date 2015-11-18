'use strict';
var path = require('path');
var glob = require('glob');
var glob2base = require('glob2base');
var gutil = require('gulp-util');
var md5Hex = require('md5-hex');

exports.emitErr = function (stream, err) {
	stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
};

// Create unique temporary directory path per task using cwd, options, sources,
// and all matched files. Switching options does not break Sass cache so we do
// it ourselves. Possibly a bug: https://github.com/sass/sass/issues/1830
exports.createIntermediatePath = function (sources, matches, options) {
	return path.join(
		options.tempDir,
		md5Hex(
			process.cwd() +
			JSON.stringify(sources) +
			JSON.stringify(matches) +
			JSON.stringify(options)
		)
	);
};

exports.calculateBase = function (source) {
	return glob2base(new glob.Glob(source));
};

exports.replaceLocation = function (origPath, currentLoc, newLoc) {
	return path.join(
		newLoc,
		path.relative(currentLoc, origPath)
	);
};
