'use strict';
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var dargs = require('dargs');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var eachAsync = require('each-async');
var intermediate = require('gulp-intermediate');

function rewriteSourcemapPaths (tempDir, origBase, cb) {
	var glob = require('glob');

	glob(path.join(tempDir, '**/*.map'), function (err, files) {
		if (err) {
			return cb(err);
		}

		eachAsync(files, function (file, index, done) {
			fs.readFile(file, function (err, data) {
				if (err) {
					return done(err);
				}

				var sourceMap = JSON.parse(data);

				// Rewrite sourcemaps to point to the original source files.
				sourceMap.sources = sourceMap.sources.map(function (source) {
					return path.join(origBase, source.replace(/\.\.\//g, ''));
				});

				fs.writeFile(file, JSON.stringify(sourceMap), done);
			});
		}, cb);
	});
}

module.exports = function (options) {
	var compileDir = '_14139e58-9ebe-4c0f-beca-73a65bb01ce9';
	options = options || {};
	options.cacheLocation = options.cacheLocation || path.join(__dirname, '.sass-cache');
	options.update = '.:' + compileDir;
	var args = dargs(options, ['bundleExec']);
	var command;

	// Error handling
	var noLogMatcher = /execvp\(\): No such file or directory|spawn ENOENT/;
	var bundleErrMatcher = /bundler: command not found|Could not find gem/;
	var bundleErr = chalk.red('Gemfile version of Sass not found. Install missing gems with `bundle install`.');

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	}
	else {
		command = 'sass';
	}

	return intermediate({ output: compileDir, container: 'gulp-ruby-sass' }, function(tempDir, cb, fileProps) {
		if (process.argv.indexOf('--verbose') !== -1) {
			gutil.log('gulp-ruby-sass:', 'Running command:',
				chalk.blue(command, args.join(' ')));
		}

		var sass = spawn(command, args, {cwd: tempDir});

		sass.stdout.on('data', function (data) {
			var msg = data.toString().trim();

			if (bundleErrMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', bundleErr);
			}
			else {
				gutil.log('gulp-ruby-sass:', msg.replace(new RegExp(compileDir, 'g'), ''));
			}
		});

		sass.stderr.on('data', function (data) {
			var msg = data.toString().trim();

			if (bundleErrMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', bundleErr);
			}
			else if (!noLogMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', msg);
			}
		});

		sass.on('error', function (err) {
			var msg = err.toString().trim();

			if (!noLogMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', chalk.red(msg));
			}
		});

		sass.on('close', function (code) {
			var dependencies = options.bundleExec ? 'Ruby, Bundler, and Sass' : 'Ruby and Sass';

			if (code === -1) {
				gutil.log('gulp-ruby-sass:', chalk.red('Missing dependencies. ' + dependencies + ' must be installed and available.'));
				return cb();
			}

			if (options.sourcemap) {
				rewriteSourcemapPaths(tempDir, fileProps.base, function (err) {
					if (err) {
						this.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
					}

					cb();
				}.bind(this));
			}
			else {
				cb();
			}
		});
	});
};
