'use strict';
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var assert = require('assert');
var assign = require('object-assign');
var vinylFile = require('vinyl-file');

var sass = require('../');
var uniqueIntermediateDirectory = require('../utils').uniqueIntermediateDirectory;

var defaultOptions = {
	quiet: true,
	unixNewlines: true // normalize compilation results on Windows systems
};

// load the expected result file from the compiled results directory
var expectedFile = function (relativePath) {
	var base = path.join(process.cwd(), 'result');
	var file = path.join(base, relativePath);

	return vinylFile.readSync(file, { base: base });
};

var sortByRelative = function (a, b) {
  return a.relative.localeCompare(b.relative);
};

describe('single file source', function () {
	this.timeout(20000);
	var files = [];
	var expected = expectedFile('file.css');

	before(function(done) {
		sass('source/file.scss', defaultOptions)
		.on('data', function (data) {
			files.push(data);
		})
		.on('end', done);
	});

	it('creates correct number of files', function () {
		assert.equal(files.length, 1);
	});

	it('creates file at correct path', function () {
		assert(files.length);
		assert.equal(files[0].relative, expected.relative);
	});

	it('creates correct file contents', function () {
		assert(files.length);
		assert.equal(
			files[0].contents.toString(),
			expected.contents.toString()
		);
	});
});

describe('directory source', function () {
	this.timeout(20000);
	var files = [];
	var expected = [
		expectedFile('directory with spaces/file with spaces.css'),
		expectedFile('directory/nested-file.css'),
		expectedFile('error.css'),
		expectedFile('file.css'),
		expectedFile('warnings.css')
	];

	before(function(done) {
		sass('source', defaultOptions)
		.on('data', function (data) {
			files.push(data);
		})
		.on('end', function() {
			files.sort(sortByRelative);
			done();
		});
	});

	it('creates correct number of files', function () {
		assert.equal(files.length, 5);
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
			// the stack trace in the error file is specific to the system it's
			// compiled on, so we just check for the error message
			if (file.basename === 'error.css') {
				var expectedError = 'Error: File to import not found or unreadable: i-dont-exist.';

				assert(
					file.contents.toString().indexOf(expectedError) !== -1,
					'The error file does not contain the expected message "' + expectedError + '".'
				);
			}
			else {
				assert.deepEqual(
					file.contents.toString(),
					expected[i].contents.toString()
				);
			}
		});
	});
});

describe('glob source', function () {
	this.timeout(20000);
	var files = [];
	var expected = [
		expectedFile('directory with spaces/file with spaces.css'),
		expectedFile('file.css')
	];

	before(function(done) {
		sass('source/**/file*.scss', defaultOptions)
		.on('data', function (data) {
			files.push(data);
		})
		.on('end', function() {
			files.sort(sortByRelative);
			done();
		});
	});

	it('creates correct number of files', function () {
		assert.equal(files.length, 2);
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

describe('concurrently run tasks', function () {
	this.timeout(20000);
	var aFiles = [];
	var bFiles = [];
	var cFiles = [];
	var counter = 0;
	var isDone = function(done) {
		counter++;
		if (counter === 3) { done(); }
	};

	before(function(done) {
		sass('source/file.scss', defaultOptions)
		.on('data', function (data) {
			aFiles.push(data);
		})
		.on('end', function () {
			isDone(done);
		});

		sass('source/directory/nested-file.scss', defaultOptions)
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
	var options = assign({}, defaultOptions, { sourcemap: true });

	before(function(done) {

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
			[ 'directory with spaces/file with spaces.scss' ],
			[ '_partial.scss', 'file.scss', 'directory/_nested-partial.scss' ]
		];

		before(function(done) {
			files = [];

			sass('source/**/file*.scss', options)
			.on('data', function (data) {
				files.push(data);
			})
			.on('end', function() {
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

		before(function(done) {
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

		before(function(done) {
			var options = assign({}, defaultOptions, { emitCompileError: true });

			sass('source/error.scss', options)
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

	describe('tempDir', function () {
		it('compiles files to the specified directory', function (done) {
			var source = 'source/file.scss';
			var tempDir = './custom-temp-dir';
			var options = assign({}, defaultOptions, { tempDir: tempDir });

			sass(source, options)
			.on('data', function (data) {
				var expectedFileLocation = path.join(
					uniqueIntermediateDirectory(tempDir, source),
					data.relative
				);

				assert.equal(
					data.contents.toString(),
					fs.readFileSync(expectedFileLocation, {encoding: 'utf8'}),
					'File does not exist in the custom temporary directory.'
				);
			})
			.on('end', function () {
				rimraf(tempDir, done);
			});
		});
	});
});
