'use strict';
var fs = require('fs');
var gulp = require('gulp');
var add = require('gulp-add');
var sass = require('./');

var fixtures = (function () {
	var fixture = fs.readFileSync('fixture/fixture.scss');
	var ret = {};
	var count = 50;

	while (count--) {
		ret[count + '.scss'] = fixture;
	}

	return ret;
})();

gulp.task('default', function () {
	return gulp.src('fixture/_obj.scss')
		.pipe(add(fixtures))
		.pipe(sass({loadPath: 'fixture'}));
});
