'use strict';
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var spawn = require('win-spawn');
var tempWrite = require('temp-write');
var dargs = require('dargs');

module.exports = function (options) {
	options = options || {};
	var passedArgs = dargs(options, ['bundleExec']);
	var bundleExec = options.bundleExec;

	return through.obj(function (file, enc, cb) {
		var self = this;

		if (file.isNull() || path.basename(file.path)[0] === '_') {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-ruby-sass', 'Streaming not supported'));
			return cb();
		}

		tempWrite(file.contents, path.extname(file.path), function (err, tempFile) {
			if (err) {
				self.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
				self.push(file);
				return cb();
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
				self.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
				self.push(file);
				return cb();
			});

			var errors = '';
			cp.stderr.setEncoding('utf8');
			cp.stderr.on('data', function (data) {
				errors += data;
			});

			cp.on('close', function (code) {
				if (code === 127) {
					self.emit('error', new gutil.PluginError('gulp-ruby-sass', 'You need to have Ruby and Sass installed and in your PATH for this task to work.'));
					self.push(file);
					return cb();
				}

				if (errors) {
					self.emit('error', new gutil.PluginError('gulp-ruby-sass', '\n' + errors.replace(tempFile, file.path).replace('Use --trace for backtrace.\n', '')));
					self.push(file);
					return cb();
				}

				if (code > 0) {
					self.emit('error', new gutil.PluginError('gulp-ruby-sass', 'Exited with error code ' + code));
					self.push(file);
					return cb();
				}

				fs.readFile(tempFile, function (err, data) {
					if (err) {
						self.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
						self.push(file);
						return cb();
					}

					self.push(new gutil.File({
						base: path.dirname(file.path),
						path: gutil.replaceExtension(file.path, '.css'),
						contents: data
					}));
					cb();
				});
			});
		});
	});
};
