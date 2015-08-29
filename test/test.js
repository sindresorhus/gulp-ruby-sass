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
