'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sass = require('./index');
var EOL = require('os').EOL;

var testFile = new gutil.File({
	cwd: __dirname,
	base: __dirname + '/styles',
	path: __dirname + '/styles/nested/fixture.scss',
	contents: new Buffer('$blue:#3bbfce;.content-navigation{border-color:$blue;}')
});
var files = [];

it('should compile Sass with sourcemaps', function (cb) {
	this.timeout(20000);

	// Assume gulp.src('app/styles/**/*.scss')
	// Assume gulp.dest('dist/styles')
	// Assume connect().use(connect.static('app')).use(connect.static('.tmp'))

	var stream = sass({
		sourcemap: true,
		sourcemapPath: '.',
		quiet: true
	});

	stream.on('data', function (file) {
		files.push(file.relative);

		// Test compiled CSS
		if (/\.css$/.test(file.path)) {
			assert.equal(file.relative, 'nested/fixture.css');
			assert.equal(
				file.contents.toString('utf-8'),
				'.content-navigation {' + EOL + '  border-color: #3bbfce; }' + EOL + EOL + '/*# sourceMappingURL=fixture.css.map */' + EOL
			);
			return;
		}

		// Test sourcemap
		if (/\.map$/.test(file.path)) {
			var sourcemap = JSON.parse(file.contents.toString());
			assert.equal(file.relative, 'nested/fixture.css.map');
			assert.equal(sourcemap.version, 3);
			assert.equal(sourcemap.file, 'fixture.css');
			assert.equal(sourcemap.sources[0], '../nested/fixture.scss');
		}
	});

	stream.on('end', function () {
		// make sure we've generated the expected files, and only those files
		assert.deepEqual(files, [ 'nested/fixture.css', 'nested/fixture.css.map' ]);
		cb();
	});

	stream.write(testFile);
	stream.end();
});
