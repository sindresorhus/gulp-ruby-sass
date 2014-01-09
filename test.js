'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sass = require('./index');

it('should output debug info', function (cb) {
	var stream = sass();

	stream.on('data', function (file) {
		assert.equal(file.relative, 'fixture.css');
		assert.equal(
			file.contents.toString(),
			'.content-navigation {\n  border-color: #3bbfce; }\n'
		);
		cb();
	});

	stream.write(new gutil.File({
		path: 'fixture.scss',
		contents: new Buffer('$blue:#3bbfce;.content-navigation{border-color:$blue;}')
	}));
});
