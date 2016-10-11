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
var spawn = require('cross-spawn');
var logger = require('./lib/logger');
var utils = require('./lib/utils');

var emitErr = utils.emitErr;
var replaceLocation = utils.replaceLocation;
var createIntermediatePath = utils.createIntermediatePath;

var defaults = {
	tempDir: path.join(osTmpdir(), 'gulp-ruby-sass'),
	verbose: false,
	sourcemap: false,
	emitCompileError: false
};

if (typeof process.getuid === 'function') {
	defaults.tempDir += '-' + process.getuid();
}

function gulpRubySass(sources, options) {
	var stream = new Readable({objectMode: true});

	// redundant but necessary
	stream._read = function () {};

	options = assign({}, defaults, options);

	// alert user that `container` is deprecated
	if (options.container) {
		gutil.log(gutil.colors.yellow('The container option has been deprecated. Simultaneous tasks work automatically now!'));
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
	if (!Array.isArray(sources)) {
		sources = [sources];
	}

	var matches = [];
	var bases = [];

	sources.forEach(function (source) {
		matches.push(glob.sync(source));
		bases.push(options.base || utils.calculateBase(source));
	});

	// log and return stream if there are no file matches
	if (matches[0].length < 1) {
		gutil.log('No files matched your Sass source.');
		stream.push(null);
		return stream;
	}

	var intermediateDir = createIntermediatePath(sources, matches, options);
	var compileMappings = [];
	var baseMappings = {};

	matches.forEach(function (matchArray, i) {
		var base = bases[i];

		matchArray.filter(function (match) {
			// remove _partials
			return path.basename(match).indexOf('_') !== 0;
		})
		.forEach(function (match) {
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
	}
	else {
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
					if (options.sourcemap === 'file' && pathExists.sync(file + '.map')) {
						// remove sourcemap comment; gulp-sourcemaps will add it back in
						data = new Buffer(convert.removeMapFileComments(data.toString()));
						var sourceMapObject = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));

						// create relative paths for sources
						sourceMapObject.sources = sourceMapObject.sources.map(function (sourcePath) {
							var absoluteSourcePath = decodeURI(path.resolve(
								'/',
								sourcePath.replace('file:///', '')
							));
							return path.relative(base, absoluteSourcePath);
						});

						vinylFile.sourceMap = sourceMapObject;
					}

					vinylFile.contents = data;
					stream.push(vinylFile);
					next();
					return;
				});
			}, function () {
				stream.push(null);
			});
		});
	});

	return stream;
}

gulpRubySass.logError = function (err) {
	var message = new gutil.PluginError('gulp-ruby-sass', err);
	process.stderr.write(message + '\n');
	this.emit('end');
};

gulpRubySass.clearCache = function (tempDir) {
	tempDir = tempDir || defaults.tempDir;
	rimraf.sync(tempDir);
};

module.exports = gulpRubySass;
