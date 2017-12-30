'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');
const Readable = require('stream').Readable;
const convert = require('convert-source-map');
const dargs = require('dargs');
const eachAsync = require('each-async');
const glob = require('glob');
const pathExists = require('path-exists');
const rimraf = require('rimraf');
const spawn = require('cross-spawn');
const PluginError = require('plugin-error');
const fancyLog = require('fancy-log');
const Vinyl = require('vinyl');
const chalk = require('chalk');
const replaceExt = require('replace-ext');
const logger = require('./lib/logger');
const utils = require('./lib/utils');

const emitErr = utils.emitErr;
const replaceLocation = utils.replaceLocation;
const createIntermediatePath = utils.createIntermediatePath;

const defaults = {
	tempDir: path.join(os.tmpdir(), 'gulp-ruby-sass'),
	verbose: false,
	sourcemap: false,
	emitCompileError: false
};

if (typeof process.getuid === 'function') {
	defaults.tempDir += `-${process.getuid()}`;
}

function gulpRubySass(sources, options) {
	const stream = new Readable({objectMode: true});

	// Redundant but necessary
	stream._read = () => {};

	options = Object.assign({}, defaults, options);

	// Alert user that `container` is deprecated
	if (options.container) {
		fancyLog(chalk.yellow('The container option has been deprecated. Simultaneous tasks work automatically now!'));
	}

	// Error if user tries to watch their files with the Sass gem
	if (options.watch || options.poll) {
		emitErr(stream, '`watch` and `poll` are not valid options for gulp-ruby-sass. Use `gulp.watch` to rebuild your files on change.');
	}

	// Error if user tries to pass a Sass option to sourcemap
	if (typeof options.sourcemap !== 'boolean') {
		emitErr(stream, 'The sourcemap option must be true or false. See the readme for instructions on using Sass sourcemaps with gulp.');
	}

	options.sourcemap = options.sourcemap === true ? 'file' : 'none';
	options.update = true;

	// Simplified handling of array sources, like gulp.src
	if (!Array.isArray(sources)) {
		sources = [sources];
	}

	const matches = [];
	const bases = [];

	for (const source of sources) {
		matches.push(glob.sync(source));
		bases.push(options.base || utils.calculateBase(source));
	}

	// Log and return stream if there are no file matches
	if (matches[0].length < 1) {
		fancyLog('No files matched your Sass source.');
		stream.push(null);
		return stream;
	}

	const intermediateDir = createIntermediatePath(sources, matches, options);
	const compileMappings = [];
	const baseMappings = {};

	matches.forEach((matchArray, i) => {
		const base = bases[i];

		matchArray.filter(match => {
			// Remove _partials
			return path.basename(match).indexOf('_') !== 0;
		})
		.forEach(match => {
			const dest = replaceExt(
				replaceLocation(match, base, intermediateDir),
				'.css'
			);
			const relative = path.relative(intermediateDir, dest);

			// Source:dest mappings for the Sass CLI
			compileMappings.push(`${match}:${dest}`);

			// Store base values by relative file path
			baseMappings[relative] = base;
		});
	});

	const args = dargs(options, [
		'bundleExec',
		'watch',
		'poll',
		'tempDir',
		'verbose',
		'emitCompileError',
		'base',
		'container'
	]).concat(compileMappings);

	let command;

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	}	else {
		command = 'sass';
	}

	// Plugin logging
	if (options.verbose) {
		logger.verbose(command, args);
	}

	const sass = spawn(command, args);

	sass.stdout.setEncoding('utf8');
	sass.stderr.setEncoding('utf8');

	sass.stdout.on('data', data => {
		logger.stdout(stream, intermediateDir, data);
	});

	sass.stderr.on('data', data => {
		logger.stderr(stream, intermediateDir, data);
	});

	sass.on('error', err => {
		logger.error(stream, err);
	});

	sass.on('close', code => {
		if (options.emitCompileError && code !== 0) {
			emitErr(stream, 'Sass compilation failed. See console output for more information.');
		}

		glob(path.join(intermediateDir, '**/*'), (err, files) => {
			if (err) {
				emitErr(stream, err);
			}

			eachAsync(files, (file, i, next) => {
				if (fs.statSync(file).isDirectory() || path.extname(file) === '.map') {
					next();
					return;
				}

				const relative = path.relative(intermediateDir, file);
				const base = baseMappings[relative];

				fs.readFile(file, (err, data) => {
					if (err) {
						emitErr(stream, err);
						next();
						return;
					}

					// Rewrite file paths so gulp thinks the file came from cwd, not the
					// intermediate directory
					const vinylFile = new Vinyl({
						cwd: process.cwd(),
						base,
						path: replaceLocation(file, intermediateDir, base)
					});

					// Sourcemap integration
					if (options.sourcemap === 'file' && pathExists.sync(file + '.map')) {
						// Remove sourcemap comment; gulp-sourcemaps will add it back in
						data = Buffer.from(convert.removeMapFileComments(data.toString()));
						const sourceMapObject = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));

						// Create relative paths for sources
						sourceMapObject.sources = sourceMapObject.sources.map(sourcePath => {
							const absoluteSourcePath = decodeURI(path.resolve(
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
				});
			}, () => {
				stream.push(null);
			});
		});
	});

	return stream;
}

gulpRubySass.logError = err => {
	const message = new PluginError('gulp-ruby-sass', err);
	process.stderr.write(`${message}\n`);
	this.emit('end');
};

gulpRubySass.clearCache = tempDir => {
	tempDir = tempDir || defaults.tempDir;
	rimraf.sync(tempDir);
};

module.exports = gulpRubySass;
