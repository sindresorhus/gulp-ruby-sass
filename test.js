'use strict';

var fs = require('fs');
var sass = require('./');
var path = require('path');
var assert = require('assert');

// var addSourcemapComment = function (name, contents) {
// 	return contents + EOL + '/*# sourceMappingURL=' + name + '.css.map */' + EOL;
// };

it('compiles Sass', function (done) {
	this.timeout(20000);

	var files = [];

	sass('fixture/source', {
		quiet: true,
		sourcemap: 'none',
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
		var noErrorFiles = files.filter(function (file) {
			return !/Error: File to import not found or unreadable/.test(file.contents.toString());
		})
		assert.equal(noErrorFiles.length, 2);

		// correctly compiled file contents
		assert.deepEqual(
		  [
				noErrorFiles[0].contents.toString(),
				noErrorFiles[1].contents.toString(),
			].sort(),
			[
				fs.readFileSync('fixture/result/fixture-a.css', {encoding: 'utf8'}),
				fs.readFileSync('fixture/result/nested/fixture-b.css', {encoding: 'utf8'})
			].sort()
		);

		done();
	});
});

// it('compiles Sass with sourcemaps', function (done) {
// 	this.timeout(20000);

// 	var files = [];

// 	gulp.src([
// 		'fixture/fixture-a.scss',
// 		'fixture/nested/fixture-b.scss'
// 	], { base: '.' })

// 	.pipe(sass({
// 		quiet: true,
// 		sourcemapPath: '../css'
//   }))

// 	.on('data', function (data) {
// 		files.push(data);
// 	})

// 	.on('end', function () {
// 		var maps = [
// 			JSON.parse(files[1].contents.toString()),
// 			JSON.parse(files[3].contents.toString())
// 		];

// 		// TODO: Fix import source paths, remove absolute path
// 		// var sources = [
// 		// 	[
// 		// 		"../../css/Users/robw/Documents/Contrib/gulp-ruby-sass/fixture/_partial-1.scss",
// 		// 		"../../css/fixture/fixture-a.scss",
// 		// 		"../../css/Users/robw/Documents/Contrib/gulp-ruby-sass/fixture/_obj-1.scss",
// 		// 		"../../css/Users/robw/Documents/Contrib/gulp-ruby-sass/fixture/component/_obj-2.scss"
// 		// 	],
// 		// 	[
// 		// 		"../../../css/Users/robw/Documents/Contrib/gulp-ruby-sass/fixture/_partial-1.scss",
// 		// 		"../../../css/fixture/nested/fixture-b.scss",
// 		// 		"../../../css/Users/robw/Documents/Contrib/gulp-ruby-sass/fixture/component/_obj-2.scss"
// 		// 	]
// 		// ]

// 		// file path
// 		assert.equal(files[1].relative, path.join('fixture', 'fixture-a.css.map'));
// 		assert.equal(files[3].relative, path.join('fixture', 'nested', 'fixture-b.css.map'));

// 		// css content
// 		assert.equal(files[0].contents.toString(), addSourcemapComment('fixture-a', results[0]));
// 		assert.equal(files[2].contents.toString(), addSourcemapComment('fixture-b', results[1]));

// 		// map content
// 		assert.equal(maps[0].version, 3);
// 		assert.equal(maps[0].file, 'fixture-a.css');
// 		assert.equal(maps[1].file, 'fixture-b.css');

// 		// TODO: Fix import source paths
// 		// assert.deepEqual(maps[0].sources, sources[0]);
// 		// assert.deepEqual(maps[1].sources, sources[1]);

// 		// ouptuts correct number of files
// 		assert.equal(files.length, 4);

// 		done();
// 	});
// });

it('emits errors but streams file on Sass error', function (done) {
	this.timeout(20000);

	var matchErrMsg = new RegExp('File to import not found or unreadable: i-dont-exist.');
	var errFileExists;

	sass('fixture/source', {
		quiet: true,
		sourcemap: 'none',
		unixNewlines: true
	})

	.on('error', function (err) {
		// throws an error
		assert(matchErrMsg.test(err.message));
	})

	.on('data', function (file) {
		// streams the erroring css file
		errFileExists = errFileExists || matchErrMsg.test(file.contents.toString())
	})

	.on('end', function () {
		assert(errFileExists);
		done();
	});
});
