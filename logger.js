'use strict';
var gutil = require('gulp-util');

// Remove temp directory for more Sass-like logging
function prettifyDirectoryLogging (msg, tempDir) {
	return msg.replace(new RegExp((tempDir) + '/?', 'g'), './');
}

module.exports = {
	verbose: function  (command, args) {
		gutil.log('Running command ' + command + ' ' + args.join(' '));
	},

	stdout: function (data, tempDir, stream) {
		// Bundler error: no Sass version found
		if (/bundler: command not found: sass/.test(data)) {
			stream.emit('error', new gutil.PluginError(
				'gulp-ruby-sass',
				'bundler: command not found: sass'
			));
		}

		// Bundler error: Gemfile not found
		else if (/Could not locate Gemfile or .bundle\/ directory/.test(data)) {
			stream.emit('error', new gutil.PluginError(
				'gulp-ruby-sass',
				'bundler: could not locate Gemfile or .bundle directory'
			));
		}

		// Sass error: directory missing
		else if (/No such file or directory @ rb_sysopen/.test(data)) {
			stream.emit('error', new gutil.PluginError('gulp-ruby-sass', data.trim()));
		}

		// Not an error: Sass logging
		else {
			data = prettifyDirectoryLogging(data, tempDir);
			data = data.trim()
			gutil.log(data);
		}
	},

	stderr: function (data, tempDir, stream) {
		var bundlerMissing = /Could not find 'bundler' \((.*?)\)/.exec(data)
		var sassVersionMissing = /Could not find gem 'sass \((.*?)\) ruby'/.exec(data)

		// Ruby error: Bundler gem not installed
		if (bundlerMissing) {
			stream.emit('error', new gutil.PluginError(
				'gulp-ruby-sass',
				'ruby: Could not find \'bundler\' (' + bundlerMissing[1] + ').'
			));
		}

		// Bundler error: no matching Sass version
		else if (sassVersionMissing) {
			stream.emit('error', new gutil.PluginError(
				'gulp-ruby-sass',
				'bundler: Could not find gem \'sass (' + sassVersionMissing[1] + ')\'.'
			));
		}

		// Sass error: file missing
		else if (/No such file or directory @ rb_sysopen/.test(data)) {
			stream.emit('error', new gutil.PluginError('gulp-ruby-sass', data.trim()));
		}

		// Not an error: Sass warnings, debug statements
		else {
			data = prettifyDirectoryLogging(data, tempDir);
			data = data.trim()
			gutil.log(data);
		}
	},

	error: function (err, stream) {
		// Spawn error: bundle or sass not installed
		if (err.code === 'ENOENT') {
			stream.emit('error', new gutil.PluginError(
				'gulp-ruby-sass',
				'Gem ' + err.path + ' is not installed.'
			));
		}

		// Other errors
		else {
			stream.emit(err);
		}
	}
}
