'use strict';
var gutil = require('gulp-util');
var emitErr = require('./utils').emitErr;

// Remove intermediate directory for more Sass-like logging
function prettifyDirectoryLogging(msg, intermediateDir) {
	return msg.replace(new RegExp(intermediateDir + '/?', 'g'), './');
}

var logger = {};

// TODO: Now that we've standardized on --update, remove parsing that only
// applies to single, non update compilations.

logger.verbose = function (command, args) {
	gutil.log('Running command ' + command + ' ' + args.join(' '));
};

logger.stdout = function (stream, intermediateDir, data) {
	if (/bundler: command not found: sass/.test(data)) {
		// Bundler error: no Sass version found
		emitErr(stream, 'bundler: command not found: sass');
	} else if (/Could not locate Gemfile or .bundle\/ directory/.test(data)) {
		// Bundler error: Gemfile not found
		emitErr(stream, 'bundler: could not locate Gemfile or .bundle directory');
	} else if (/No such file or directory @ rb_sysopen/.test(data)) {
		// Sass error: directory missing
		emitErr(stream, data.trim());
	} else {
		// Not an error: Sass logging
		data = prettifyDirectoryLogging(data, intermediateDir);
		data = data.trim();
		gutil.log(data);
	}
};

logger.stderr = function (stream, intermediateDir, data) {
	var bundlerMissing = /Could not find 'bundler' \((.*?)\)/.exec(data);
	var sassVersionMissing = /Could not find gem 'sass \((.*?)\) ruby'/.exec(data);

	if (bundlerMissing) {
		// Ruby error: Bundler gem not installed
		emitErr(stream, 'ruby: Could not find \'bundler\' (' + bundlerMissing[1] + ').');
	} else if (sassVersionMissing) {
		// Bundler error: no matching Sass version
		emitErr(stream, 'bundler: Could not find gem \'sass (' + sassVersionMissing[1] + ')\'.');
	} else if (/No such file or directory @ rb_sysopen/.test(data)) {
		// Sass error: file missing
		emitErr(stream, data.trim());
	} else {
		// Not an error: Sass warnings, debug statements
		data = prettifyDirectoryLogging(data, intermediateDir);
		data = data.trim();
		gutil.log(data);
	}
};

logger.error = function (stream, err) {
	if (err.code === 'ENOENT') {
		// Spawn error: gems not installed
		emitErr(stream, 'Gem ' + err.path + ' is not installed.');
	} else {
		// Other errors
		emitErr(stream, err);
	}
};

module.exports = logger;
