'use strict';
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var dargs = require('dargs');
var slash = require('slash');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var eachAsync = require('each-async');
var intermediate = require('gulp-intermediate');

function rewriteSourcemapPaths (cssDir, relPath, cb) {
	var glob = require('glob');

	glob(path.join(cssDir, '**/*.map'), function (err, files) {
		if (err) {
			cb(err);
			return;
		}

		eachAsync(files, function (file, i, next) {
			fs.readFile(file, function (err, data) {
				if (err) {
					next(err);
					return;
				}

				var sourceMap = JSON.parse(data);
				var stepUp = path.relative(path.dirname(file), cssDir);

				// rewrite sourcemaps to point to the original source files
				sourceMap.sources = sourceMap.sources.map(function (source) {
					var sourceBase = source.replace(/\.\.\//g, '');

					// normalize to browser style paths if we're on windows
					return slash(path.join(stepUp, relPath, sourceBase));
				});

				fs.writeFile(file, JSON.stringify(sourceMap), next);
			});
		}, cb);
	});
}

module.exports = function (options) {
	var compileDir = '_14139e58-9ebe-4c0f-beca-73a65bb01ce9';
	var procDir = process.cwd();
	options = options || {};
	options.cacheLocation = options.cacheLocation || path.join(procDir, '.sass-cache');
	options.update = '.:' + compileDir;
	var args = dargs(options, ['bundleExec', 'watch', 'poll', 'sourcemapPath']);
	var command;

	// Error handling
	var noLogMatcher = /execvp\(\): No such file or directory|spawn ENOENT/;
	var bundleErrMatcher = /bundler: command not found|Could not find gem/;
	var bundleErr = chalk.red('Gemfile version of Sass not found. Install missing gems with `bundle install`.');

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	} else {
		command = 'sass';
	}

	return intermediate({
		output: compileDir,
		container: 'gulp-ruby-sass'
	}, function (tempDir, cb, fileProps) {
		if (process.argv.indexOf('--verbose') !== -1) {
			gutil.log('gulp-ruby-sass:', 'Running command:',
				chalk.blue(command, args.join(' ')));
		}

		var sass = spawn(command, args, {cwd: tempDir});

		sass.stdout.setEncoding('utf8');
		sass.stderr.setEncoding('utf8');

		sass.stdout.on('data', function (data) {
			var msg = data.trim();

			if (bundleErrMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', bundleErr);
			} else {
				gutil.log('gulp-ruby-sass:', msg.replace(new RegExp(compileDir, 'g'), ''));
			}
		});

		sass.stderr.on('data', function (data) {
			var msg = data.trim();

			if (bundleErrMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', bundleErr);
			} else if (!noLogMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', msg);
			}
		});

		sass.on('error', function (err) {
			var msg = err.trim();

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

			if (options.sourcemap && options.sourcemapPath) {
				var cssDir = path.join(tempDir, compileDir);

				rewriteSourcemapPaths(cssDir, options.sourcemapPath, function (err) {
					if (err) {
						this.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
					}

					cb();
				}.bind(this));
			} else {
				cb();
			}
		});
	});
};
