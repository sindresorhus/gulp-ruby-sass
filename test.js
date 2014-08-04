'use strict';

var assert = require('assert');
var gulp = require('gulp');
var sass = require('./');
var EOL = require('os').EOL;

var addSourcemapComment = function (name, contents) {
	return contents + EOL + '/*# sourceMappingURL=' + name + '.css.map */' + EOL;
};

var results = [
	'h1 .link {' + EOL +
	'  color: green; }' + EOL + EOL +
	'html {'  + EOL +
	'  font-size: 16px;'  + EOL +
	'  line-height: 24px; }' + EOL + EOL +
	'body {' + EOL +
	'  color: black;' + EOL +
	'  content: \'local imported mixin\';' + EOL +
	'  content: \'component mixin\'; }' + EOL,

	'h1 .link {' + EOL +
	'  color: green; }' + EOL + EOL +
	'h2 {' + EOL +
	'  content: \'component mixin\'; }' + EOL
];

it('compiles Sass', function (done) {
	this.timeout(20000);

	var files = [];

	gulp.src([
		'fixture/sass/fixture-a.scss',
		'fixture/sass/nested/fixture-b.scss'
	], { base: 'fixture' })

	.pipe(sass({ quiet: true }))

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		// file path
		assert.equal(files[0].relative, 'sass/fixture-a.css');
		assert.equal(files[1].relative, 'sass/nested/fixture-b.css');

		// css content
		assert.equal(files[0].contents.toString(), results[0]);
		assert.equal(files[1].contents.toString(), results[1]);

		// ouptuts correct number of files
		assert.equal(files.length, 2);

		done();
	});
});

it('compiles Sass with sourcemaps', function (done) {
	this.timeout(20000);

	var files = [];

	gulp.src([
		'fixture/sass/fixture-a.scss',
		'fixture/sass/nested/fixture-b.scss'
	], { base: 'fixture/sass', verbose: true }
	)

	.pipe(sass({
		quiet: true,
		sourcemap: true,
		sourcemapBase: 'fixture/sass',
		sourcemapPath: '../sass'
  }))

	.on('data', function (data) {
		files.push(data);
	})

	.on('end', function () {
		var maps = [
			JSON.parse(files[1].contents.toString()),
			JSON.parse(files[3].contents.toString())
		];

		var sources = [
			[
				'../sass/_partial-1.scss',
				'../sass/fixture-a.scss',
				'../sass/_obj-1.scss',
				'../sass/component/_obj-2.scss'
			],
			[
				'../../sass/_partial-1.scss',
				'../../sass/nested/fixture-b.scss',
				'../../sass/component/_obj-2.scss'
			]
		];

		// file path
		assert.equal(files[1].relative, 'fixture-a.css.map');
		assert.equal(files[3].relative, 'nested/fixture-b.css.map');

		// css content
		assert.equal(files[0].contents.toString(), addSourcemapComment('fixture-a', results[0]));
		assert.equal(files[2].contents.toString(), addSourcemapComment('fixture-b', results[1]));

		// map content
		assert.equal(maps[0].version, 3);
		assert.equal(maps[0].file, 'fixture-a.css');
		assert.equal(maps[1].file, 'fixture-b.css');

		// sources point to the right files on disk
		assert.deepEqual(maps[0].sources, sources[0]);
		assert.deepEqual(maps[1].sources, sources[1]);

		// ouptuts correct number of files
		assert.equal(files.length, 4);

		done();
	});
});

it('emits errors but still streams file on Sass error', function (done) {
	this.timeout(20000);

	var errMsgMatcher = new RegExp('File to import not found or unreadable: i-dont-exist.');

	gulp.src('fixture/sass/fixture-error.scss')

	.pipe(sass())

	.on('error', function (err) {
		// throws an error
		assert(errMsgMatcher.test(err.message));
	})

	.on('data', function (file) {
		// still pushes the compiled erroring css file through
		assert(errMsgMatcher.test(file.contents.toString()));
	})

	.on('end', function () {
		done();
	});
});
