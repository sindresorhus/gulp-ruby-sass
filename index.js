'use strict';
var fs = require('fs');
var path = require('path');
var Readable = require('stream').Readable;
var glob = require('glob');
var dargs = require('dargs');
var slash = require('slash');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var spawn = require('win-spawn');
var gutil = require('gulp-util');
var assign = require('object-assign');
var convert = require('convert-source-map');
var eachAsync = require('each-async');
var osTmpdir = require('os-tmpdir');
var pathExists = require('path-exists');
var File = require('vinyl');
var logger = require('./logger');

// for now, source is only a single directory or a single file
module.exports = function (source, options) {
	var stream = new Readable({objectMode: true});
	var cwd = process.cwd();
	var defaults = {
		tempDir: osTmpdir(),
		container: 'gulp-ruby-sass',
		verbose: false,
		sourcemap: false
	};
	var command;
	var args;
	var base;
	var intermediateDir;
	var destFile;
	var compileMappings;

	// redundant but necessary
	stream._read = function () {};

	options = assign(defaults, options);

	// sourcemap can only be true or false; warn those trying to pass a Sass string option
	if (typeof options.sourcemap !== 'boolean') {
		throw new Error('The sourcemap option must be true or false. See the readme for instructions on using Sass sourcemaps with gulp.');
	}

	// reassign options.sourcemap boolean to one of our two acceptable Sass arguments
	options.sourcemap = options.sourcemap === true ? 'file' : 'none';

	// sass options need unix style slashes
	intermediateDir = slash(path.join(options.tempDir, options.container));

	// directory source
	if (path.extname(source) === '') {
		base = path.join(cwd, source);
		compileMappings = source + ':' + intermediateDir;
		options.update = true;
	}
	// single file source
	else {
		base = path.join(cwd, path.dirname(source));
		destFile = slash(path.join(intermediateDir, path.basename(source, path.extname(source)) + '.css')); // sass options need unix style slashes
		compileMappings = [ source, destFile ];
		mkdirp(intermediateDir);
	}
	// TODO: implement glob file source

	args = dargs(options, [
		'bundleExec',
		'watch',
		'poll',
		'tempDir',
		'container',
		'verbose'
	]).concat(compileMappings);

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	} else {
		command = 'sass';
	}

	// plugin logging
	if (options.verbose) {
		logger.verbose(command, args);
	}

	var sass = spawn(command, args);

	sass.stdout.setEncoding('utf8');
	sass.stderr.setEncoding('utf8');

	sass.stdout.on('data', function (data) {
		logger.stdout(data, intermediateDir, stream);
	});

	sass.stderr.on('data', function (data) {
		logger.stderr(data, intermediateDir, stream);
	});

	sass.on('error', function (err) {
		logger.error(err, stream);
	});

	sass.on('close', function (code) {
		glob(path.join(intermediateDir, '**', '*'), function (err, files) {
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

					// rewrite file paths so gulp thinks the files came from cwd, not the
					// OS temp directory
					var vinylFile = new File({
						cwd: cwd,
						base: base,
						path: file.replace(intermediateDir, base)
					});
					var sourcemap;

					// if we are managing sourcemaps and the sourcemap exists
					if (options.sourcemap === 'file' && pathExists.sync(file + '.map')) {
						// remove Sass sourcemap comment; gulp-sourcemaps will add it back in
						data = new Buffer( convert.removeMapFileComments(data.toString()) );
						sourcemap = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));

						// create relative paths for sources
						sourcemap.sources = sourcemap.sources.map(function (sourcemapSource) {
							var absoluteSourcePath = decodeURI(path.resolve('/', sourcemapSource.replace('file:///', '')))
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
				rimraf(intermediateDir, function () {
					stream.push(null);
				});
			});
		});
	});

	return stream;
};
