'use strict';
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var dargs = require('dargs');
var slash = require('slash');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var intermediate = require('gulp-intermediate');

function rewriteSourcemapPaths (compileDir, relativePath, cb) {
	var eachAsync = require('each-async');
	var glob = require('glob');

	glob(path.join(compileDir, '**/*.map'), function (err, files) {
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
				var stepUp = path.relative(path.dirname(file), compileDir);

				// rewrite sourcemaps to point to the original source files
				sourceMap.sources = sourceMap.sources.map(function (source) {
					var sourceBase = source.replace(/\.\.\//g, '');

					// normalize to browser style paths if we're on windows
					return slash(path.join(stepUp, relativePath, sourceBase));
				});

				fs.writeFile(file, JSON.stringify(sourceMap, null, '  '), next);
			});
		}, cb);
	});
}

function removePaths(msg, paths) {
	paths.forEach(function (path) {
		msg = msg.replace(new RegExp(path + '/?', 'g'), '');
	});

	return msg;
}

function gutilErr(err) {
	return new gutil.PluginError('gulp-ruby-sass', err);
}

module.exports = function (options) {
	var relativeCompileDir = '_14139e58-9ebe-4c0f-beca-73a65bb01ce9';
	var procDir = process.cwd();

	// error handling
	var sassErrMatcher = /^error/;
	var noBundlerMatcher = /Gem bundler is not installed/;
	var noGemfileMatcher = /Could not locate Gemfile/;
	var noBundleSassMatcher = /bundler: command not found|Could not find gem/;
	var noSassMatcher = /execvp\(\): No such file or directory|spawn ENOENT/;
	var bundleErrMsg = 'Gemfile version of Sass not found. Install missing gems with `bundle install`.';
	var noSassErrMsg = 'spawn ENOENT: Missing the Sass executable. Please install and make available on your PATH.';

	var stream = intermediate({
		output: relativeCompileDir,
		container: 'gulp-ruby-sass'
	}, function (tempDir, cb, vinylFiles) {

		// all paths passed to sass must have unix path separators
		tempDir = slash(tempDir);
		var compileDir = slash(path.join(tempDir, relativeCompileDir));

		options = options || {};
		options.update = tempDir + ':' + compileDir;
		options.loadPath = typeof options.loadPath === 'undefined' ? [] : [].concat(options.loadPath);

		// add loadPaths for each temp file
		vinylFiles.forEach(function (file) {
			var loadPath = slash(path.dirname(path.relative(procDir, file.path)));

			if (options.loadPath.indexOf(loadPath) === -1) {
				options.loadPath.push(loadPath);
			}
		});

		var args = dargs(options, ['bundleExec', 'watch', 'poll', 'sourcemapPath']);

		// temporary logging until gulp adds its own
		if (process.argv.indexOf('--verbose') !== -1) {
			gutil.log('gulp-ruby-sass:', 'Running command:', chalk.blue(command, args.join(' ')));
		}

		var command;

		if (options.bundleExec) {
			command = 'bundle';
			args.unshift('exec', 'sass');
		} else {
			command = 'sass';
		}

		var sass = spawn(command, args);

		sass.stdout.setEncoding('utf8');
		sass.stderr.setEncoding('utf8');

		sass.stdout.on('data', function (data) {
			var msg = removePaths(data, [tempDir, relativeCompileDir]).trim();

			if (sassErrMatcher.test(msg) || noBundlerMatcher.test(msg) || noGemfileMatcher.test(msg)) {
				stream.emit('error', gutilErr(msg));
			}
			else if (noBundleSassMatcher.test(msg)) {
				stream.emit('error', gutilErr(bundleErrMsg));
			}
			else {
				gutil.log('gulp-ruby-sass:', msg);
			}
		});

		sass.stderr.on('data', function (data) {
			var msg = removePaths(data, [tempDir, relativeCompileDir]).trim();

			if (noBundleSassMatcher.test(msg)) {
				stream.emit('error', gutilErr(bundleErrMsg));
			} else if (!noSassMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:, stderr', msg);
			}
		});

		sass.on('error', function (err) {
			if (noSassMatcher.test(err.message)) {
				stream.emit('error', gutilErr(noSassErrMsg));
			} else {
				stream.emit('error', gutilErr(err));
			}
		});

		sass.on('close', function (code) {
			if (options.sourcemap && options.sourcemapPath) {
				rewriteSourcemapPaths(compileDir, options.sourcemapPath, function (err) {
					if (err) {
						stream.emit('error', gutilErr(err));
					}

					cb();
				});
			} else {
				cb();
			}
		});
	});

	return stream;
};
