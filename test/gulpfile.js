'use strict';
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('..');

gulp.task('sass', () =>
	sass('source/**/*.scss', {verbose: true})
		.on('error', sass.logError)
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('result'))
);
