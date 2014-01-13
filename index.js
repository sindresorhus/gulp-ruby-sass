'use strict';
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var map = require('map-stream');
var spawn = require('win-spawn');
var tempWrite = require('temp-write');
var dargs = require('dargs');

module.exports = function (options) {
	options = options || {};
	var passedArgs = dargs(options, ['bundleExec']);
	var bundleExec = options.bundleExec;

	return map(function (file, cb) {
		if (file.isNull()) {
			return cb(null, file);
		}

		if (file.isStream()) {
			return cb(new gutil.PluginError('gulp-ruby-sass', 'Streaming not supported'));
		}

		if (path.basename(file.path)[0] === '_') {
			return cb(null, file);
		}

		tempWrite(file.contents, path.extname(file.path), function (err, tempFile) {
			if (err) {
				return cb(new gutil.PluginError('gulp-ruby-sass', err));
			}

			var args = [
				'sass',
				tempFile,
				tempFile,
				'--load-path', path.dirname(file.path)
			].concat(passedArgs);

			if (bundleExec) {
				args.unshift('bundle', 'exec');
			}

			// if we're compiling SCSS or CSS files
			if (path.extname(file.path) === '.css') {
				args.push('--scss');
			}

			var cp = spawn(args.shift(), args);

			cp.on('error', function (err) {
				return cb(new gutil.PluginError('gulp-ruby-sass', err));
			});

			var errors = '';
			cp.stderr.setEncoding('utf8');
			cp.stderr.on('data', function (data) {
				errors += data;
			});

			cp.on('close', function (code) {
				if (code === 127) {
					return cb(new gutil.PluginError('gulp-ruby-sass', 'You need to have Ruby and Sass installed and in your PATH for this task to work.'));
				}

				if (errors) {
					return cb(new gutil.PluginError('gulp-ruby-sass', '\n' + errors.replace(tempFile, file.path).replace('Use --trace for backtrace.\n', '')));
				}

				if (code > 0) {
					return cb(new gutil.PluginError('gulp-ruby-sass', 'Exited with error code ' + code));
				}

				fs.readFile(tempFile, function (err, data) {
					if (err) {
						return cb(new gutil.PluginError('gulp-ruby-sass', err));
					}

					cb(null, new gutil.File({
						base: path.dirname(file.path),
						path: gutil.replaceExtension(file.path, '.css'),
						contents: data
					}));
				});
			});
		});
	});
};
