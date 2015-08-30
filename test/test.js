'use strict';
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var vinylFile = require('vinyl-file');

var sass = require('../');

var defaultOptions = {
	quiet: true,
	unixNewlines: true // normalize compilation results on Windows systems
};

describe('compiles single file source', function() {
	this.timeout(20000);
	var files = [];

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
		assert.equal(files[0].relative, 'file.css');
	});

	it('creates correct file contents', function () {
		assert.equal(
			files[0].contents.toString(),
			new vinylFile.readSync('result/file.css').contents.toString()
		);
	});
});

describe('compiles directory source', function() {
	this.timeout(20000);
	var files = [];

	before(function(done) {
		sass('source', defaultOptions)
		.on('data', function (data) {
			files.push(data);
		})
		.on('end', done);
	});

	it('creates correct number of files', function () {
		assert.equal(files.length, 5);
	});

	it('creates file at correct path', function () {
		files.forEach(function (file) {
			assert(
				fs.statSync( path.join('result', file.relative) ).isFile(),
				'The file doesn\'t exist in the results directory.'
			);
		});
	});

	it('creates correct file contents', function () {
		files.forEach(function (file) {
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
					new vinylFile.readSync( path.join('result', file.relative )).contents.toString()
				);
			}
		});
	});
});
