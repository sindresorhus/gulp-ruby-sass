'use strict';
var fs = require('fs');
var path = require('path');
var Readable = require('stream').Readable;

var assign = require('object-assign');
var convert = require('convert-source-map');
var dargs = require('dargs');
var eachAsync = require('each-async');
var glob = require('glob');
var gutil = require('gulp-util');
var osTmpdir = require('os-tmpdir');
var pathExists = require('path-exists');
var rimraf = require('rimraf');
var spawn = require('win-spawn');

var logger = require('./logger');
var utils = require('./utils');

var emitErr = utils.emitErr;
var uniqueIntermediateDirectory = utils.uniqueIntermediateDirectory;
var replaceLocation = utils.replaceLocation;

function gulpRubySass (sources, options) {
	options = assign({
		tempDir: osTmpdir(),
		verbose: false,
		sourcemap: false,
		emitCompileError: false
	}, options);

	var stream = new Readable({objectMode: true});
	stream._read = function () {}; 	// redundant but necessary

	// alert user that `container` is deprecated
	if (options.container) {
		gutil.log(gutil.colors.yellow(
			'The container option has been deprecated. Simultanious tasks work automatically now!\n' +
			'This will become an error in gulp-ruby-sass 2.0'
		));
	}

	// error if user tries to watch their files with the Sass gem
	if (options.watch || options.poll) {
		emitErr(stream, '`watch` and `poll` are not valid options for gulp-ruby-sass. Use `gulp.watch` to rebuild your files on change.');
	}

	// error if user tries to pass a Sass option to sourcemap
	if (typeof options.sourcemap !== 'boolean') {
		emitErr(stream, 'The sourcemap option must be true or false. See the readme for instructions on using Sass sourcemaps with gulp.');
	}

	options.sourcemap = options.sourcemap === true ? 'file' : 'none';
	options.update = true;

	// simplified handling of array sources, like gulp.src
	if (!Array.isArray(sources)) { sources = [sources]; }

	var intermediateDir = uniqueIntermediateDirectory(options.tempDir, sources);
	var compileMappings = [];
	var baseMappings = {};

	sources.forEach(function (source) {
		var base = options.base || utils.calculateBase(source);

		// match files and remove _partials
		var matches = glob.sync(source)
		.filter(function (match) {
			return path.basename(match).indexOf('_') !== 0;
		});

		matches.forEach(function (match) {
			var dest = gutil.replaceExtension(
				replaceLocation(match, base, intermediateDir),
				'.css'
			);
			var relative = path.relative(intermediateDir, dest);

			// source:dest mappings for the Sass CLI
			compileMappings.push(match + ':' + dest);

			// store base values by relative file path
			baseMappings[relative] = base;
		});
	});

	var args = dargs(options, [
		'bundleExec',
		'watch',
		'poll',
		'tempDir',
		'verbose',
		'emitCompileError',
		'base',
		'container'
	]).concat(compileMappings);

	var command;

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
		logger.stdout(stream, intermediateDir, data);
	});

	sass.stderr.on('data', function (data) {
		logger.stderr(stream, intermediateDir, data);
	});

	sass.on('error', function (err) {
		logger.error(stream, err);
	});

	sass.on('close', function (code) {
		if (options.emitCompileError && code !== 0) {
			emitErr(stream, 'Sass compilation failed. See console output for more information.');
		}

		glob(path.join(intermediateDir, '**', '*'), function (err, files) {
			if (err) {
				emitErr(stream, err);
			}

			eachAsync(files, function (file, i, next) {
				if (fs.statSync(file).isDirectory() || path.extname(file) === '.map') {
					next();
					return;
				}

				var relative = path.relative(intermediateDir, file);
				var base = baseMappings[relative];

				fs.readFile(file, function (err, data) {
					if (err) {
						emitErr(stream, err);
						next();
						return;
					}

					// rewrite file paths so gulp thinks the file came from cwd, not the
					// intermediate directory
					var vinylFile = new gutil.File({
						cwd: process.cwd(),
						base: base,
						path: replaceLocation(file, intermediateDir, base)
					});

					// sourcemap integration
					// if we are managing sourcemaps and a sourcemap exists
					if (options.sourcemap === 'file' && pathExists.sync(file + '.map')) {

						// remove sourcemap comment; gulp-sourcemaps will add it back in
						data = new Buffer( convert.removeMapFileComments(data.toString()) );
						var sourcemapObject = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));

						// create relative paths for sources
						sourcemapObject.sources = sourcemapObject.sources.map(function (sourcemapPath) {
							var absoluteSourcemapPath = decodeURI(path.resolve(
								'/',
								sourcemapPath.replace('file:///', '')
							));
							return path.relative(base, absoluteSourcemapPath);
						});

						vinylFile.sourceMap = sourcemapObject;
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
}

gulpRubySass.logError = function logError(err) {
	var message = new gutil.PluginError('gulp-ruby-sass', err);
	process.stderr.write(message + '\n');
	this.emit('end');
};

module.exports = gulpRubySass;
