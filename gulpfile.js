'use strict';
var gulp = require('gulp');
var sass = require('./index.js');

gulp.task('default', function () {
	return gulp.src('fixture/**/*.scss')
		.pipe(sass());
});
