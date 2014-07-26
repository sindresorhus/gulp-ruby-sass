'use strict';
var gulp = require('gulp');
var sass = require('./');

gulp.task('default', function () {
	return gulp.src('fixture/**/*.scss')
		.pipe(sass({ sourcemap: true }));
});
