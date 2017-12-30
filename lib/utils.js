'use strict';
const path = require('path');
const glob = require('glob');
const glob2base = require('glob2base');
const md5Hex = require('md5-hex');
const PluginError = require('plugin-error');

exports.emitErr = (stream, err) => {
	stream.emit('error', new PluginError('gulp-ruby-sass', err));
};

// Create unique temporary directory path per task using cwd, options, sources,
// and all matched files. Switching options does not break Sass cache so we do
// it ourselves. Possibly a bug: https://github.com/sass/sass/issues/1830
exports.createIntermediatePath = (sources, matches, options) => {
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

exports.calculateBase = source => glob2base(new glob.Glob(source));

exports.replaceLocation = (origPath, currentLoc, newLoc) => path.join(newLoc, path.relative(currentLoc, origPath));
