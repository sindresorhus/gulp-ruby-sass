'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sass = require('./index');

it('should compile Sass', function (cb) {
	var stream = sass({
		sourcemap: true
	});

	stream.on('data', function (file) {
		if (/\.css$/.test(file.path)) {
			assert.equal(file.relative, 'fixture.css');
			assert.equal(
				file.contents.toString(),
				'.content-navigation {\n  border-color: #3bbfce; }\n\n/*# sourceMappingURL=fixture.css.map */\n'
			);
			return;
		}

		assert.equal(file.relative, 'fixture.css.map');
		assert.equal(JSON.parse(file.contents.toString()).version, 3);
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		base: __dirname + '/fixture',
		path: __dirname + '/fixture/fixture.scss',
		contents: new Buffer('$blue:#3bbfce;.content-navigation{border-color:$blue;}')
	}));

	stream.end();
});
