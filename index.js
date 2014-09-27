'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var chalk = require('chalk');
var dargs = require('dargs');
var slash = require('slash');
var spawn = require('win-spawn');
var gutil = require('gulp-util');
var assign = require('object-assign')
var eachAsync = require('each-async');
var osTempDir = require('os').tmpdir();
var escapeRegExp = require('escape-string-regexp');

var File = require('vinyl');
var Readable = require('stream').Readable;

function clipPath (clip, sourcePath) {
	return sourcePath.match(new RegExp(escapeRegExp(clip) + '(.*)$'))[1]
};

// function rewriteSourcemapPaths (compileDir, relativePath, cb) {
// 	glob(path.join(compileDir, '**/*.map'), function (err, files) {
// 		if (err) {
// 			cb(err);
// 			return;
// 		}

// 		eachAsync(files, function (file, i, next) {
// 			fs.readFile(file, function (err, data) {
// 				if (err) {
// 					next(err);
// 					return;
// 				}

// 				var sourceMap = JSON.parse(data);
// 				var stepUp = path.relative(path.dirname(file), compileDir);

// 				// rewrite sourcemaps to point to the original source files
// 				sourceMap.sources = sourceMap.sources.map(function (source) {
// 					var sourceBase = source.replace(/\.\.\//g, '');

// 					// normalize to browser style paths if we're on windows
// 					return slash(path.join(stepUp, relativePath, sourceBase));
// 				});

// 				fs.writeFile(file, JSON.stringify(sourceMap, null, '  '), next);
// 			});
// 		}, cb);
// 	});
// }

// function removePaths(msg, paths) {
// 	paths.forEach(function (path) {
// 		msg = msg.replace(new RegExp((path) + '/?', 'g'), '');
// 	});

// 	return msg;
// }

// function createErr(err, opts) {
// 	return new gutil.PluginError('gulp-ruby-sass', err, opts);
// }

// TODO: For now, source is only a single dir Source will be either a directory,
// a group of directories, or a glob of indv. files.
module.exports = function (source, options) {
	var stream = new Readable({objectMode: true});
	var cwd = process.cwd();
	var command;
	var args;
	var dest;

	// redundant but necessary
	stream._read = function () {};

	options = assign({}, options);
	options.update = true;
	options.container = options.container || 'gulp-ruby-sass';

	// all options passed to sass must use unix style slashes
	dest = slash(path.join(osTempDir, options.container));

	args = dargs(options, [
		'bundleExec',
		'watch',
		'poll',
		'container'
	]).concat(source + ':' + dest);

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	} else {
		command = 'sass';
	}

	// temporary logging until gulp adds its own
	if (process.argv.indexOf('--verbose') !== -1) {
		gutil.log('gulp-ruby-sass:', 'Running command:', chalk.blue(command, args.join(' ')));
	}

	// error handling
	// var sassErrMatcher = /^error/;
	// var noBundlerMatcher = /Gem bundler is not installed/;
	// var noGemfileMatcher = /Could not locate Gemfile/;
	// var noBundleSassMatcher = /bundler: command not found|Could not find gem/;
	// var noSassMatcher = /execvp\(\): No such file or directory|spawn ENOENT/;
	// var bundleErrMsg = 'Gemfile version of Sass not found. Install missing gems with `bundle install`.';
	// var noSassErrMsg = 'spawn ENOENT: Missing the Sass executable. Please install and make available on your PATH.';

	var sass = spawn(command, args);

	sass.stdout.setEncoding('utf8');
	sass.stderr.setEncoding('utf8');

	sass.stdout.on('data', function (data) {
		// var msg = removePaths(data, [tempDir, relativeCompileDir]).trim();

		// if (sassErrMatcher.test(msg) || noBundlerMatcher.test(msg) || noGemfileMatcher.test(msg)) {
		// 	stream.emit('error', createErr(msg, {showStack: false}));
		// } else if (noBundleSassMatcher.test(msg)) {
		// 	stream.emit('error', createErr(bundleErrMsg, {showStack: false}));
		// } else {
		// 	gutil.log('gulp-ruby-sass:', msg);
		// }
	});

	sass.stderr.on('data', function (data) {
		// var msg = removePaths(data, [tempDir, relativeCompileDir]).trim();

		// if (noBundleSassMatcher.test(msg)) {
		// 	stream.emit('error', createErr(bundleErrMsg, {showStack: false}));
		// } else if (!noSassMatcher.test(msg)) {
		// 	gutil.log('gulp-ruby-sass: stderr:', msg);
		// }
	});

	sass.on('error', function (err) {
		// if (noSassMatcher.test(err.message)) {
		// 	stream.emit('error', createErr(noSassErrMsg, {showStack: false}));
		// } else {
		// 	stream.emit('error', createErr(err));
		// }
	});

	sass.on('close', function (code) {
		// TODO: Here be dragons. Right now we grab all CSS files. This will have to
		// be all files with some logic for sourcemaps, then grab x files based on
		// the task source glob.
		glob(path.join(dest, '**', '*.css'), function (err, files) {
			if (err) {
				stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
			}

			var base = path.join(cwd, source);

			eachAsync(files, function (file, i, next) {
				fs.readFile(file, function (err, data) {
					if (err) {
						stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
						next();
						return;
					}

					var vinylFile = new File({
						cwd: cwd,
						base: base,
						path: path.join(base, clipPath(dest, file)),
						contents: new Buffer(data)
					});

					stream.push(vinylFile);
					next();
				});
			}, function () {
				stream.push(null);
			});
		});

		// if (options.sourcemap && options.sourcemapPath) {
		// 	rewriteSourcemapPaths(compileDir, options.sourcemapPath, function (err) {
		// 		if (err) {
		// 			stream.emit('error', createErr(err));
		// 		}

		// 		cb();
		// 	});
		// } else {
		// 	cb();
		// }
	});

	return stream;
};
