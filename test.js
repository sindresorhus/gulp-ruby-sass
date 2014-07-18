'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sass = require('./index');
var EOL = require('os').EOL;

var testFiles = [
	new gutil.File({
		cwd: __dirname,
		base: __dirname + '/styles',
		path: __dirname + '/styles/module/fixture-a.scss',
		contents: new Buffer('@import \'../vars/fixture-b\'; aside {border-color:$blue;}')
	}),
	new gutil.File({
		cwd: __dirname,
		base: __dirname + '/styles',
		path: __dirname + '/styles/vars/_fixture-b.scss',
		contents: new Buffer('$blue:#3bbfce;')
	})
];

it('should compile Sass', function (done) {
	this.timeout(20000);

	var files = [];
	var result = 'aside {' + EOL +
		'  border-color: #3bbfce; }' + EOL;
	var stream = sass({ quiet: true });

	stream.on('data', function (file) {
		files.push(file);
	});

	stream.on('end', function () {
		// sass file
		assert.equal(files[0].relative, 'module/fixture-a.css');
		assert.equal(files[0].contents.toString('utf-8'), result);

		// generates the correct number of files (does not output partials)
		assert.equal(files.length, 1);

		done();
	});

	stream.write(testFiles[0]);
	stream.write(testFiles[1]);
	stream.end();
});

it('should compile Sass with sourcemaps', function (done) {
	this.timeout(20000);

	var files = [];
	var result = 'aside {' + EOL +
    '  border-color: #3bbfce; }' + EOL + EOL +
    '/*# sourceMappingURL=fixture-a.css.map */' + EOL;
	var stream = sass({ sourcemap: true, sourcemapPath: '../scss', quiet: true });

	stream.on('data', function (file) {
		files.push(file);
	});

	stream.on('end', function () {
		// sass file
		assert.equal(files[0].relative, 'module/fixture-a.css');
		assert.equal(files[0].contents.toString('utf-8'), result);

		// sourcemap file
		var sourcemap = JSON.parse(files[1].contents.toString());

		assert.equal(files[1].relative, 'module/fixture-a.css.map');
		assert.equal(sourcemap.version, 3);
		assert.equal(sourcemap.file, 'fixture-a.css');
		assert.deepEqual(sourcemap.sources,  [
			'../../scss/module/fixture-a.scss',
			'../../scss/vars/_fixture-b.scss'
		]);

		// generates the correct number of files
		assert.equal(files.length, 2);

		done();
	});

	stream.write(testFiles[0]);
	stream.write(testFiles[1]);
	stream.end();
});
