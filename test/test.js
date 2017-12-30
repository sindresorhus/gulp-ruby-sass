/* eslint-env mocha */
'use strict';
const path = require('path');
const assert = require('assert');
const pathExists = require('path-exists');
const rimraf = require('rimraf');
const vinylFile = require('vinyl-file');
const sass = require('../');
const logger = require('../lib/logger');

const defaultOptions = {
	quiet: true,
	// Normalize compilation results on Windows systems
	unixNewlines: true
};

// Load the expected result file from the compiled results directory
const loadExpectedFile = (relativePath, base) => {
	base = base || 'result';
	const file = path.join(base, relativePath);
	return vinylFile.readSync(file, {base});
};

const sortByRelative = (a, b) => a.relative.localeCompare(b.relative);

const compilesSource = (source, expected, options) => {
	const files = [];
	options = options || defaultOptions;

	before(done => {
		sass(source, options)
		.on('data', data => {
			files.push(data);
		})
		.on('end', () => {
			files.sort(sortByRelative);
			done();
		});
	});

	it('creates the correct number of files', () => {
		assert.equal(files.length, expected.length);
	});

	it('creates files at the correct path', () => {
		assert(files.length);
		files.forEach((file, i) => {
			assert.equal(file.relative, expected[i].relative);
		});
	});

	it('creates correct file contents', () => {
		assert(files.length);
		files.forEach((file, i) => {
			assert.deepEqual(
				file.contents.toString(),
				expected[i].contents.toString()
			);
		});
	});
};

describe('compiling', function () {
	this.timeout(20000);

	describe('a single file', () => {
		const source = 'source/file.scss';
		const expected = [loadExpectedFile('file.css')];

		compilesSource(source, expected);
	});

	describe('multiple files', () => {
		const source = 'source/**/*.scss';
		const expected = [
			loadExpectedFile('directory with spaces/file with spaces.css'),
			loadExpectedFile('directory/file.css'),
			loadExpectedFile('file.css'),
			loadExpectedFile('warnings.css')
		];

		compilesSource(source, expected);
	});

	describe('array sources', () => {
		const source = [
			'source/file.scss',
			'source/directory with spaces/file with spaces.scss'
		];
		const expected = [
			loadExpectedFile('file with spaces.css', 'result/directory with spaces'),
			loadExpectedFile('file.css')
		];

		compilesSource(source, expected);
	});

	describe('nonexistent sources', () => {
		it('does not error when no files match source', done => {
			const source = 'source/does-not-exist.scss';
			let error;

			sass(source, defaultOptions)
			.on('data', () => {})
			.on('error', err => {
				error = err;
			})
			.on('end', () => {
				assert.equal(error, undefined);
				done();
			});
		});
	});
});

describe('concurrently run tasks', function () {
	this.timeout(20000);
	const aFiles = [];
	const bFiles = [];
	const cFiles = [];
	let counter = 0;

	const isDone = done => {
		counter++;

		if (counter === 3) {
			done();
		}
	};

	before(done => {
		sass('source/file.scss', defaultOptions)
		.on('data', data => {
			aFiles.push(data);
		})
		.on('end', () => {
			isDone(done);
		});

		sass('source/directory/file.scss', defaultOptions)
		.on('data', data => {
			bFiles.push(data);
		})
		.on('end', () => {
			isDone(done);
		});

		sass('source/directory with spaces/file with spaces.scss', defaultOptions)
		.on('data', data => {
			cFiles.push(data);
		})
		.on('end', () => {
			isDone(done);
		});
	});

	it('don\'t intermix result files', () => {
		assert.equal(aFiles.length, 1);
		assert.equal(bFiles.length, 1);
		assert.equal(cFiles.length, 1);
	});
});

describe('options', function () {
	this.timeout(20000);

	describe('sourcemap', () => {
		describe('replaces Sass sourcemaps with vinyl sourceMaps', () => {
			const files = [];
			const options = Object.assign({}, defaultOptions, {sourcemap: true});

			before(done => {
				sass('source/file.scss', options)
				.on('data', data => {
					files.push(data);
				})
				.on('end', done);
			});

			it('doesn\'t stream Sass sourcemap files', () => {
				assert.equal(files.length, 1);
			});

			it('removes Sass sourcemap comment', () => {
				assert(
					files[0].contents.toString().indexOf('sourceMap') === -1,
					'File contains sourcemap comment'
				);
			});

			it('adds a vinyl sourcemap', () => {
				assert.equal(typeof files[0].sourceMap, 'object');
				assert.equal(files[0].sourceMap.version, 3);
			});
		});

		const includesCorrectSources = (source, expected) => {
			const files = [];
			const options = Object.assign({}, defaultOptions, {sourcemap: true});

			before(done => {
				sass(source, options)
				.on('data', data => {
					files.push(data);
				})
				.on('end', () => {
					files.sort(sortByRelative);
					done();
				});
			});

			it('includes the correct sources', () => {
				files.forEach((file, i) => {
					assert.deepEqual(file.sourceMap.sources, expected[i]);
				});
			});
		};

		describe('compiling files from a single file source', () => {
			const source = ['source/file.scss'];
			const expected = [
				['_partial.scss', 'file.scss', 'directory/_nested-partial.scss']
			];

			includesCorrectSources(source, expected);
		});

		describe('compiling files and directories with spaces', () => {
			const source = ['source/directory with spaces/file with spaces.scss'];
			const expected = [
				['file with spaces.scss']
			];

			includesCorrectSources(source, expected);
		});

		describe('compiling files from glob source', () => {
			const source = ['source/**/file.scss'];
			const expected = [
				['_partial.scss'],
				['_partial.scss', 'file.scss', 'directory/_nested-partial.scss']
			];

			includesCorrectSources(source, expected);
		});
	});

	describe('emitCompileError', () => {
		let error;

		before(done => {
			const options = Object.assign({}, defaultOptions, {emitCompileError: true});

			sass('special/error.scss', options)
			.on('data', () => {})
			.on('error', err => {
				error = err;
			})
			.on('end', done);
		});

		it('emits a gulp error when Sass compilation fails', () => {
			assert(error instanceof Error);
			assert.equal(
				error.message,
				'Sass compilation failed. See console output for more information.'
			);
		});
	});

	describe('base (for colliding sources)', () => {
		const source = ['source/file.scss', 'source/directory/file.scss'];
		const expected = [
			loadExpectedFile('directory/file.css'),
			loadExpectedFile('file.css')
		];
		const options = Object.assign({}, defaultOptions, {base: 'source'});

		compilesSource(source, expected, options);
	});

	describe('tempDir', () => {
		it('compiles files to the specified directory', done => {
			const source = 'source/file.scss';
			const tempDir = './custom-temp-dir';
			const options = Object.assign({}, defaultOptions, {tempDir});

			assert.equal(
				pathExists.sync(tempDir),
				false,
				'The temporary directory already exists, and would create false positives.'
			);

			sass(source, options)

			.on('data', () => {
				assert(pathExists.sync(tempDir));
			})

			// Clean up if tests are run locally
			.on('end', () => {
				rimraf(tempDir, done);
			});
		});
	});
});

describe('caching', function () {
	this.timeout(20000);

	it('compiles an unchanged file faster the second time', done => {
		sass.clearCache();
		const startOne = new Date();

		sass('special/computational.scss', defaultOptions)
		.on('data', () => {})
		.on('end', () => {
			const endOne = new Date();
			const runtimeOne = endOne - startOne;

			sass('special/computational.scss', defaultOptions)
			.on('data', () => {})
			.on('end', () => {
				const runtimeTwo = new Date() - endOne;

				assert(
					// Pad time to avoid potential intermittents
					runtimeOne > runtimeTwo + 50,
					'Compilation times were not decreased significantly. Caching may be broken.'
				);

				done();
			});
		});
	});
});

describe('logging', function () {
	this.timeout(20000);

	it('correctly processes paths with special characters', () => {
		const dir = 'foo/bar/++/__/(a|f)';
		const msg = 'dir: ' + dir + '/some/directory, Gettin\' Sassy!';

		assert(
			logger.prettifyDirectoryLogging(msg, dir),
			'dir: some/directory, Gettin\' Sassy!'
		);
	});
});
