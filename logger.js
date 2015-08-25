'use strict';
var gutil = require('gulp-util');

function emitErr (stream, err) {
	stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
}

// Remove intermediate directory for more Sass-like logging
function prettifyDirectoryLogging (msg, intermediateDir) {
	return msg.replace(new RegExp((intermediateDir) + '/?', 'g'), './');
}

module.exports = {
	verbose: function  (command, args) {
		gutil.log('Running command ' + command + ' ' + args.join(' '));
	},

	stdout: function (stream, intermediateDir, data) {
		// Bundler error: no Sass version found
		if (/bundler: command not found: sass/.test(data)) {
			emitErr(stream, 'bundler: command not found: sass');
		}

		// Bundler error: Gemfile not found
		else if (/Could not locate Gemfile or .bundle\/ directory/.test(data)) {
			emitErr(stream, 'bundler: could not locate Gemfile or .bundle directory');
		}

		// Sass error: directory missing
		else if (/No such file or directory @ rb_sysopen/.test(data)) {
			emitErr(stream, data.trim());
		}

		// Not an error: Sass logging
		else {
			data = prettifyDirectoryLogging(data, intermediateDir);
			data = data.trim()
			gutil.log(data);
		}
	},

	stderr: function (stream, intermediateDir, data) {
		var bundlerMissing = /Could not find 'bundler' \((.*?)\)/.exec(data)
		var sassVersionMissing = /Could not find gem 'sass \((.*?)\) ruby'/.exec(data)

		// Ruby error: Bundler gem not installed
		if (bundlerMissing) {
			emitErr(stream, 'ruby: Could not find \'bundler\' (' + bundlerMissing[1] + ').');
		}

		// Bundler error: no matching Sass version
		else if (sassVersionMissing) {
			emitErr(stream, 'bundler: Could not find gem \'sass (' + sassVersionMissing[1] + ')\'.');
		}

		// Sass error: file missing
		else if (/No such file or directory @ rb_sysopen/.test(data)) {
			emitErr(stream, data.trim());
		}

		// Not an error: Sass warnings, debug statements
		else {
			data = prettifyDirectoryLogging(data, intermediateDir);
			data = data.trim()
			gutil.log(data);
		}
	},

	error: function (stream, err) {
		// Spawn error: gems not installed
		if (err.code === 'ENOENT') {
			emitErr(stream, 'Gem ' + err.path + ' is not installed.');
		}

		// Other errors
		else {
			emitErr(stream, err);
		}
	}
}
