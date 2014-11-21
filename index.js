'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var chalk = require('chalk');
var dargs = require('dargs');
var slash = require('slash');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var spawn = require('win-spawn');
var gutil = require('gulp-util');
var assign = require('object-assign');
var convert = require('convert-source-map');
var eachAsync = require('each-async');
var osTempDir = require('os').tmpdir();
var escapeRegExp = require('escape-string-regexp');

var File = require('vinyl');
var Readable = require('stream').Readable;

// Removes OS temp dir and line breaks for more Sass-like logging
function formatMsg (msg, tempDir) {
	msg = msg.replace(new RegExp((tempDir) + '/?', 'g'), '');
	msg = msg.trim();
	return msg;
}

function newErr (err, opts) {
	return new gutil.PluginError('gulp-ruby-sass', err, opts);
}

// TODO: For now, source is only a single dir Source will be either a directory,
// a group of directories, or a glob of indv. files.
module.exports = function (source, options) {
	var stream = new Readable({objectMode: true});
	var cwd = process.cwd();
	var command;
	var args;
	var base;
	var destDir;
	var destFile;
	var compileMappings;

	// redundant but necessary
	stream._read = function () {};

	options = assign({}, options);
	options.container = options.container || 'gulp-ruby-sass';

	// sourcemap can only be true or false; warn those trying to pass a Sass string option
	if (typeof options.sourcemap === 'string') {
		throw newErr('The sourcemap option must be true or false. See the readme for instructions on using Sass sourcemaps with gulp.');
	}

	options.sourcemap = options.sourcemap ? 'file' : 'none';

	// directory source
	if (path.extname(source) === '') {
		base = path.join(cwd, source);
		destDir = slash(path.join(osTempDir, options.container)); // sass options need unix style slashes
		compileMappings = source + ':' + destDir;
		options.update = true;
	}
	// single file source
	else {
		base = path.join(cwd, path.dirname(source));
		destDir = path.join(osTempDir, options.container);
		destFile = slash(path.join(destDir, path.basename(source, path.extname(source)) + '.css')); // sass options need unix style slashes
		compileMappings = [ source, destFile ];
		mkdirp(destDir);
	}
	// TODO: implement glob file source

	args = dargs(options, [
		'bundleExec',
		'watch',
		'poll',
		'container'
	]).concat(compileMappings);

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
		var msg = formatMsg(data, destDir);
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
		var msg = formatMsg(data, destDir);

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
		// TODO: Here be dragons. Right now we grab all files in the directory. This
		// will have to grab x files based on the task source glob.
		glob(path.join(destDir, '**', '*'), function (err, files) {
			if (err) {
				stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
			}

			eachAsync(files, function (file, i, next) {
				if (fs.statSync(file).isDirectory() || path.extname(file) === '.map') {
					next();
					return;
				}

				fs.readFile(file, function (err, data) {
					if (err) {
						stream.emit('error', new gutil.PluginError('gulp-ruby-sass', err));
						next();
						return;
					}

					// rewrite file paths so gulp thinks the file came from the cwd, not
					// the temp directory
					var vinylFile = new File({
						cwd: cwd,
						base: base,
						path: file.replace(destDir, base)
					});
					var sourcemap;

					if (options.sourcemap === 'file' && path.extname(file) === '.css' && fs.existsSync(file + '.map')) {
						// remove Sass sourcemap comment; gulp-sourcemaps will add it back in
						data = new Buffer( convert.removeMapFileComments(data.toString()) );
						sourcemap = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));

						// create relative paths for sources
						sourcemap.sources = sourcemap.sources.map(function (sourcemapSource) {
							var absoluteSourcePath = sourcemapSource.replace('file://', '');
							return path.relative(base, absoluteSourcePath);
						});

						vinylFile.sourceMap = sourcemap;
					}

					vinylFile.contents = data;
					stream.push(vinylFile);
					next();
					return;
				});
			}, function () {
				// cleanup previously generated files for next run
				// TODO: This kills caching. Keeping will push files through that are not in
				// the current gulp.src. We need to decide whether to use a Sass style caching
				// strategy, or a gulp style strategy, and what each would look like.
				rimraf(destDir, function () {
					stream.push(null);
				});
			});
		});
	});

	return stream;
};
