'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sass = require('./index');
var EOL = require('os').EOL;

it('should compile Sass', function (cb) {
	var stream = sass({
		sourcemap: true,
		quiet: true
	});

	stream.on('data', function (file) {
		if (/\.css$/.test(file.path)) {
			assert.equal(file.relative, 'fixture.css');
			assert.equal(
				file.contents.toString('utf-8'),
				'.content-navigation {' + EOL + '  border-color: #3bbfce; }' + EOL + EOL + '/*# sourceMappingURL=fixture.css.map */' + EOL
			);
			return;
		}

		var sm = JSON.parse(file.contents.toString());
		assert.equal(file.relative, 'fixture.css.map');
		assert.equal(sm.version, 3);
		assert.equal(sm.file, 'fixture.css');

		// TODO: Map paths are wrong -- points to source one dir up (as makes sense)
		// assert.equal(sm.sources[0], 'fixture.scss');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture',
		path: __dirname + '/fixture/fixture.scss',
		contents: new Buffer('$blue:#3bbfce;.content-navigation{border-color:$blue;}')
	}));

	stream.end();
});
