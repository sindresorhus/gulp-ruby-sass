/* eslint-env mocha */
'use strict';
var path = require('path');
var assert = require('assert');
var assign = require('object-assign');
var pathExists = require('path-exists');
var rimraf = require('rimraf');
var vinylFile = require('vinyl-file');
var sass = require('../');

var defaultOptions = {
	quiet: true,
	// normalize compilation results on Windows systems
	unixNewlines: true
};

// load the expected result file from the compiled results directory
var loadExpectedFile = function (relativePath, base) {
	base = base || 'result';
	var file = path.join(base, relativePath);
	return vinylFile.readSync(file, {base: base});
};

var sortByRelative = function (a, b) {
	return a.relative.localeCompare(b.relative);
};

var compilesSource = function (source, expected) {
	var files = [];

	before(function (done) {
		sass(source, defaultOptions)
		.on('data', function (data) {
			files.push(data);
		})
		.on('end', function () {
			files.sort(sortByRelative);
			done();
		});
	});

	it('creates the correct number of files', function () {
		assert.equal(files.length, expected.length);
	});

	it('creates files at the correct path', function () {
		assert(files.length);
		files.forEach(function (file, i) {
			assert.equal(file.relative, expected[i].relative);
		});
	});

	it('creates correct file contents', function () {
		assert(files.length);
		files.forEach(function (file, i) {
			assert.deepEqual(
				file.contents.toString(),
				expected[i].contents.toString()
			);
		});
	});
};

describe('single file', function () {
	this.timeout(20000);
	var source = 'source/file.scss';
	var expected = [loadExpectedFile('file.css')];

	compilesSource(source, expected);
});

describe('multiple files', function () {
	this.timeout(20000);
	var source = 'source/**/*.scss';
	var expected = [
		loadExpectedFile('directory with spaces/file with spaces.css'),
		loadExpectedFile('directory/file.css'),
		loadExpectedFile('file.css'),
		loadExpectedFile('warnings.css')
	];

	compilesSource(source, expected);
});

describe('array sources', function () {
	this.timeout(20000);
	var source = [
		'source/file.scss',
		'source/directory with spaces/file with spaces.scss'
	];
	var expected = [
		loadExpectedFile('file with spaces.css', 'result/directory with spaces'),
		loadExpectedFile('file.css')
	];

	compilesSource(source, expected);
});

describe('concurrently run tasks', function () {
	this.timeout(20000);
	var aFiles = [];
	var bFiles = [];
	var cFiles = [];
	var counter = 0;

	var isDone = function (done) {
		counter++;

		if (counter === 3) {
			done();
		}
	};

	before(function (done) {
		sass('source/file.scss', defaultOptions)
		.on('data', function (data) {
			aFiles.push(data);
		})
		.on('end', function () {
			isDone(done);
		});

		sass('source/directory/file.scss', defaultOptions)
		.on('data', function (data) {
			bFiles.push(data);
		})
		.on('end', function () {
			isDone(done);
		});

		sass('source/directory with spaces/file with spaces.scss', defaultOptions)
		.on('data', function (data) {
			cFiles.push(data);
		})
		.on('end', function () {
			isDone(done);
		});
	});

	it('don\'t intermix result files', function () {
		assert.equal(aFiles.length, 1);
		assert.equal(bFiles.length, 1);
		assert.equal(cFiles.length, 1);
	});
});

describe('sourcemap', function () {
	this.timeout(20000);

	var files = [];
	var options = assign({}, defaultOptions, {sourcemap: true});

	before(function (done) {
		sass('source/file.scss', options)
		.on('data', function (data) {
			files.push(data);
		})
		.on('end', done);
	});

	it('doesn\'t stream Sass sourcemap files', function () {
		assert.equal(files.length, 1);
	});

	it('removes Sass sourcemap comment', function () {
		assert(
			files[0].contents.toString().indexOf('sourceMap') === -1,
			'File contains sourcemap comment'
		);
	});

	it('adds a vinyl sourcemap', function () {
		assert.equal(typeof files[0].sourceMap, 'object');
		assert.equal(files[0].sourceMap.version, 3);
	});

	it('includes the correct sources', function () {
		assert.deepEqual(
			files[0].sourceMap.sources,
			['_partial.scss', 'file.scss', 'directory/_nested-partial.scss']
		);
	});

	describe('compiling files from glob source', function () {
		var expected = [
			['_partial.scss'],
			['_partial.scss', 'file.scss', 'directory/_nested-partial.scss']
		];

		before(function (done) {
			files = [];

			sass('source/**/file.scss', options)
			.on('data', function (data) {
				files.push(data);
			})
			.on('end', function () {
				files.sort(sortByRelative);
				done();
			});
		});

		it('includes the correct sources', function () {
			files.forEach(function (file, i) {
				assert.deepEqual(file.sourceMap.sources, expected[i]);
			});
		});
	});

	describe('compiling files and directories with spaces', function () {
		var expected = ['file with spaces.scss'];

		before(function (done) {
			files = [];

			sass('source/directory with spaces/file with spaces.scss', options)
			.on('data', function (data) {
				files.push(data);
			})
			.on('end', done);
		});

		it('includes the correct sources', function () {
			assert.deepEqual(files[0].sourceMap.sources, expected);
		});
	});
});

describe('options', function () {
	this.timeout(20000);

	describe('emitCompileError', function () {
		var error;

		before(function (done) {
			var options = assign({}, defaultOptions, {emitCompileError: true});

			sass('special/error.scss', options)
			.on('data', function () {})
			.on('error', function (err) {
				error = err;
			})
			.on('end', done);
		});

		it('emits a gulp error when Sass compilation fails', function () {
			assert(error instanceof Error);
			assert.equal(
				error.message,
				'Sass compilation failed. See console output for more information.'
			);
		});
	});

	describe('base (for colliding sources)', function () {
		this.timeout(20000);
		var files = [];
		var expected = [
			loadExpectedFile('directory/file.css'),
			loadExpectedFile('file.css')
		];
		var options = assign({}, defaultOptions, {base: 'source'});

		before(function (done) {
			sass(['source/file.scss', 'source/directory/file.scss'], options)
			.on('data', function (data) {
				files.push(data);
			})
			.on('end', function () {
				files.sort(sortByRelative);
				done();
			});
		});

		it('creates correct number of files', function () {
			assert.equal(files.length, expected.length);
		});

		it('creates file at correct path', function () {
			assert(files.length);
			files.forEach(function (file, i) {
				assert.equal(file.relative, expected[i].relative);
			});
		});

		it('creates correct file contents', function () {
			assert(files.length);
			files.forEach(function (file, i) {
				assert.deepEqual(
					file.contents.toString(),
					expected[i].contents.toString()
				);
			});
		});
	});

	describe('tempDir', function () {
		it('compiles files to the specified directory', function (done) {
			var source = 'source/file.scss';
			var tempDir = './custom-temp-dir';
			var options = assign({}, defaultOptions, {tempDir: tempDir});

			assert.equal(
				pathExists.sync(tempDir),
				false,
				'The temporary directory already exists, and would create false positives.'
			);

			sass(source, options)

			.on('data', function () {
				assert(pathExists.sync(tempDir));
			})

			// clean up if tests are run locally
			.on('end', function () {
				rimraf(tempDir, done);
			});
		});
	});
});

describe('caching', function () {
	it('compiles an unchanged file faster the second time', function (done) {
		sass.clearCache();

		var startOne = new Date();

		sass('special/computational.scss', defaultOptions)
		.on('data', function () {})
		.on('end', function () {
			var endOne = new Date();
			var runtimeOne = endOne - startOne;

			sass('special/computational.scss', defaultOptions)
			.on('data', function () {})
			.on('end', function () {
				var runtimeTwo = new Date() - endOne;

				assert(
					// pad time to avoid potential intermittents
					runtimeOne > runtimeTwo + 50,
					'Compilation times were not decreased significantly. Caching may be broken.'
				);

				done();
			});
		});
	});
});
