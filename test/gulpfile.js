'use strict';
var gulp = require('gulp');
var sass = require('../');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function() {
	return sass('source', { verbose: true })
	.on('error', sass.logError)
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('result'));
});
