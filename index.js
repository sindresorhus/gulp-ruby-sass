'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var chalk = require('chalk');
var dargs = require('dargs');
var slash = require('slash');
var rimraf = require('rimraf');
var spawn = require('win-spawn');
var gutil = require('gulp-util');
var assign = require('object-assign');
var eachAsync = require('each-async');
var osTempDir = require('os').tmpdir();
var escapeRegExp = require('escape-string-regexp');

var File = require('vinyl');
var Readable = require('stream').Readable;

function clipPath (clip, sourcePath) {
	return sourcePath.match(new RegExp(escapeRegExp(clip) + '(.*)$'))[1];
}

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

// Removes OS temp dir and line breaks for more Sass-like logging
function formatMsg(msg, tempDir) {
	msg = msg.replace(new RegExp((tempDir) + '/?', 'g'), '');
	msg = msg.trim();
	return msg;
}

function newErr(err, opts) {
	return new gutil.PluginError('gulp-ruby-sass', err, opts);
}

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

	// remove the previously generated files
	// TODO: This kills caching. Keeping will push files through that are not in
	// the current gulp.src. We need to decide whether to use a Sass style caching
	// strategy, or a gulp style strategy, and what each would look like.
	rimraf.sync(dest);

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
	var matchNoSass = /execvp\(\): No such file or directory|spawn ENOENT/;
	var msgNoSass = 'Missing the Sass executable. Please install and make available on your PATH.';
	var matchSassErr = /error\s/;
	var matchNoBundler = /ERROR: Gem bundler is not installed/;
	var matchNoGemfile = /Could not locate Gemfile/;
	var matchNoBundledSass = /bundler: command not found: sass|Could not find gem/;

	var sass = spawn(command, args);

	sass.stdout.setEncoding('utf8');
	sass.stderr.setEncoding('utf8');

	// sass stdout: successful compile messages
	// bundler stdout: bundler not installed, no gemfile, correct version of sass not installed
	sass.stdout.on('data', function (data) {
		var msg = formatMsg(data, dest);
		var isError = [
			matchSassErr,
			matchNoBundler,
			matchNoGemfile,
			matchNoBundledSass
		].some(function (match) {
			return match.test(msg);
		});

		if (isError) {
			stream.emit('error', newErr(msg));
		} else {
			gutil.log('gulp-ruby-sass stdout:', msg);
		}
	});

	// sass stderr: warnings, debug statements
	// bundler stderr: no version of sass installed
	// spawn stderr: no sass executable
	sass.stderr.on('data', function (data) {
		var msg = formatMsg(data, dest);

		if (matchNoBundledSass.test(msg)) {
			stream.emit('error', newErr(msg));
		}
		else if (!matchNoSass.test(msg)) {
			gutil.log('gulp-ruby-sass stderr:', msg);
		}
	});

	// spawn error: no sass executable
	sass.on('error', function (err) {
		if (matchNoSass.test(err)) {
			err.message = msgNoSass;
		}
		stream.emit('error', newErr(err));
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
