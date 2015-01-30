'use strict';

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('../');

// inline sourcemaps
gulp.task('sass-inline', function() {
	return sass('source', { sourcemap: true, verbose: true })
	.on('error', function (err) {
	  console.error('Error!', err.message);
   })
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('result'));
});

// file sourcemaps
gulp.task('sass-file', function() {
	return sass('source', { sourcemap: true })
	.on('error', function (err) {
	  console.error('Error!', err.message);
   })

	.pipe(sourcemaps.write('../maps', {
		includeContent: false,
		sourceRoot: '/fixture/source'
	}))

	.pipe(gulp.dest('result'));
});
