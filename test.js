'use strict';
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var pathExists = require('path-exists');
var convert = require('convert-source-map');
var sourcemaps = require('gulp-sourcemaps');

var sass = require('./');
var utils = require('./utils');

var expectedSources = [
	'_obj-1.scss,_partial-1.scss,component/_obj-2.scss,fixture-a.scss',
	'_partial-1.scss,component/_obj-2.scss,nested/fixture-b.scss'
];

var expectedFixtureAContents = fs.readFileSync('fixture/result/fixture-a.css', {encoding: 'utf8'});
var expectedFixtureBContents = fs.readFileSync('fixture/result/nested/fixture-b.css', {encoding: 'utf8'});

function getCssFiles (files) {
	return files.filter(function (file) {
		return path.extname(file.path) === '.css';
	});
}

function getErrorFiles (files) {
	return files.filter(function (file) {
		return /Error: File to import not found or unreadable/.test(file.contents.toString());
	});
}

function getSourceMapFiles (files) {
	return files.filter(function (file) {
		return path.extname(file.path) === '.map';
	});
}

function getValidCssFiles (files) {
	return rejectFromArray(getCssFiles(files), getErrorFiles(files));
}

function rejectFromArray (baseArray, rejectArray) {
	return baseArray.filter(function (value) {
		return rejectArray.indexOf(value) === -1
	});
}

beforeEach(function(done) {
	sass.clearCache(undefined, undefined, done);
});

it('compiles Sass from file source', function (done) {
	this.timeout(20000);

	var files = [];

	sass('fixture/source/fixture-a.scss', {
		quiet: true,
		unixNewlines: true
	})

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		// number of files
		assert.equal(files.length, 1);

		// file paths
		assert.equal(files[0].relative, 'fixture-a.css');

		// file contents
		assert.equal(files[0].contents.toString(), expectedFixtureAContents);

		done();
	});
});

it('compiles Sass from directory source', function (done) {
	this.timeout(20000);

	var files = [];

	sass('fixture/source', {
		quiet: true,
		unixNewlines: true
	})

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		// number of files
		assert.equal(files.length, 3);

		// file paths
		assert.deepEqual(
			[ files[0].relative, files[1].relative, files[2].relative ].sort(),
			[ 'fixture-error.css', 'fixture-a.css', path.join('nested', 'fixture-b.css') ].sort()
		);

		// find the compile error file and remove it from the array
		var validCssFiles = getValidCssFiles(files);
		assert.equal(validCssFiles.length, 2);

		// correctly compiled file contents
		assert.deepEqual(
		  [
				validCssFiles[0].contents.toString(),
				validCssFiles[1].contents.toString(),
			].sort(),
			[
				expectedFixtureAContents,
				expectedFixtureBContents
			].sort()
		);

		done();
	});
});

it('doesn\'t stream map files', function (done) {
	this.timeout(20000);

	var files = [];

	sass('fixture/source', {
		quiet: true,
		sourcemap: true
	})

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		// number of files
		assert.equal(files.length, 3);
		done();
	});
});

it('outputs sourcemap files', function (done) {
	this.timeout(20000);

	var files = [];

	sass('fixture/source', {
		quiet: true,
		sourcemap: true
	})

	.pipe(sourcemaps.write('../maps', {
		includeContent: false,
		sourceRoot: '/fixture/source'
	}))

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		var sourceMapFiles = getSourceMapFiles(files);
		assert.equal(sourceMapFiles.length, 2);

		var validCssFiles = getValidCssFiles(files);
		assert.equal(validCssFiles.length, 2);

		sourceMapFiles.forEach(function (file) {
			var sourcemap = JSON.parse(file.contents.toString());
			// check object is sourcemap
			assert.equal(sourcemap.version, 3)
			// check sourcemap points to the correct files
			assert.notEqual(expectedSources.indexOf(sourcemap.sources.sort().join(',')), -1);
		});

		done();
	});
});

it('outputs inline sourcemaps', function (done) {
	this.timeout(20000);

	var files = [];

	sass('fixture/source', {
		quiet: true,
		sourcemap: true
	})

	.pipe(sourcemaps.write())

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		var sourceMapFiles = getSourceMapFiles(files);
		assert.equal(sourceMapFiles.length, 0);

		var validCssFiles = getValidCssFiles(files);
		assert.equal(validCssFiles.length, 2);

		validCssFiles.forEach(function (file) {
			var sourcemap = convert.fromSource(file.contents.toString()).sourcemap;
			// check object is sourcemap
			assert.equal(sourcemap.version, 3);
			// check sourcemap points to the correct files
			assert.notEqual(expectedSources.indexOf(sourcemap.sources.sort().join(',')), -1);
		});

		done();
	});
});

it('outputs correct sourcemap paths for files and paths containing spaces', function (done) {
	this.timeout(20000);

	var file;

	sass('fixture/source/directory with spaces/_partial with spaces.scss', {
		quiet: true,
		sourcemap: true
	})

	.pipe(sourcemaps.write())

	.on('data', function (data) {
		file = data;
	})

	.on('end', function () {
		var sourcemap = convert.fromSource(file.contents.toString()).sourcemap;
		// check object is sourcemap
		assert.equal(sourcemap.version, 3);
		// check sourcemap points to the correct file
		assert.deepEqual(sourcemap.sources, ['_partial with spaces.scss']);

		done();
	});
});

it('`emitCompileError` emits a gulp error when Sass compilation fails', function (done) {
	this.timeout(20000);
	var errorOccured = false;

	sass('fixture/source/fixture-error.scss', {
		quiet: true,
		unixNewlines: true,
		emitCompileError: true
	})

	.on('data', function () {})

	.on('error', function (err) {
		errorOccured = true;
		assert.equal(
			'Sass compilation failed. See console output for more information.',
			err.message
		);
	})

	.on('end', function () {
		assert(errorOccured, 'An error was not thrown');
		done();
	});
});

it('clears a single source\'s intermediateDir when clearCache is called with a source', function (done) {
	this.timeout(20000);

	var source = 'fixture/source/fixture-a.scss';
	var options = {
		quiet: true,
		tempDir: '.tmp'
	};
	var intermediateDir = utils.uniqueIntermediateDirectory(options.tempDir, source);

	sass(source, options)

	.on('data', function () {})

	.on('end', function () {
		assert(pathExists.sync(intermediateDir));
		done();

		sass.clearCache(source, {}, function () {
			assert(!pathExists.sync(intermediateDir));
			done();
		});
	});
});

it('clears every intermediateDir for a cwd when clearCache is called without a source', function (done) {
	this.timeout(20000);

	var source = 'fixture/source/fixture-a.scss';
	var options = {
		quiet: true,
		tempDir: '.tmp'
	};
	var cacheDir = utils.cacheDirectory(options.tempDir);

	sass(source, options)

	.on('data', function () {})

	// TODO: This is somewhat of an inference. Could be hardend by running
	// multiple tasks, clearing cache and asserting when all are done. For now
	// this is acceptable.
	.on('end', function () {
		assert(pathExists.sync(cacheDir));
		done();

		sass.clearCache(source, {}, function () {
			assert(!pathExists.sync(cacheDir));
			done();
		});
	});
});
