'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sass = require('./index');
var EOL = require('os').EOL;

it('should compile Sass with sourcemaps', function (cb) {
	this.timeout(20000);

	var stream = sass({
		sourcemap: true,
		quiet: true
	});

	stream.on('data', function (file) {
		// Test compiled CSS
		if (/\.css$/.test(file.path)) {
			assert.equal(file.relative, 'nested/fixture.css');
			assert.equal(
				file.contents.toString('utf-8'),
				'.content-navigation {' + EOL + '  border-color: #3bbfce; }' + EOL + EOL + '/*# sourceMappingURL=fixture.css.map */' + EOL
			);
			return;
		}

		// Test sourcemaps
		var sourcemap = JSON.parse(file.contents.toString());
		assert.equal(file.relative, 'nested/fixture.css.map');
		assert.equal(sourcemap.version, 3);
		assert.equal(sourcemap.file, 'fixture.css');

		assert.equal(sourcemap.sources[0], __dirname + '/fixture/nested/fixture.scss');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture',
		path: __dirname + '/fixture/nested/fixture.scss',
		contents: new Buffer('$blue:#3bbfce;.content-navigation{border-color:$blue;}')
	}));

	stream.end();
});
