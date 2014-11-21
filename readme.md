# gulp-ruby-sass [![Build Status](https://travis-ci.org/sindresorhus/gulp-ruby-sass.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ruby-sass)

> Compile Sass to CSS with [Ruby Sass](http://sass-lang.com/install)

This is slower than [gulp-sass](https://github.com/dlmanning/gulp-sass), but more stable and feature-rich.

*Issues with the output should be reported on the Sass [issue tracker](https://github.com/sass/sass/issues).*


## Install

```sh
$ npm install --save-dev gulp-ruby-sass
```

You also need to have [Ruby](http://www.ruby-lang.org/en/downloads/) and [Sass](http://sass-lang.com/download.html) installed. If you're on OS X or Linux you probably already have Ruby; test with `ruby -v` in your terminal. When you've confirmed you have Ruby, run `gem install sass` to install Sass.


## Usage

#### gulp-ruby-sass is a gulp source adapter

Use gulp-ruby-sass instead of `gulp.src` to compile a file or directory.  
**Note:** gulp-ruby-sass doesn't support globs yet.

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('sass', function() {
	return sass('source/') 
	.on('error', function (err) {
	  console.error('Error!', err.message);
   })
	.pipe(gulp.dest('result'));
});
```

#### Recompiling on changes

Use [gulp-watch](https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulpwatchglob--opts-tasks-or-gulpwatchglob--opts-cb) to automatically recompile your files on change.


#### Handling errors

Handle Sass errors with an `on('error', cb)` listener or a plugin like [plumber](https://github.com/floatdrop/gulp-plumber). gulp-ruby-sass throws errors like a gulp plugin, but streams the erroring files so you can see the errors in your browser.


### Plugin options

#### sourcemap

Type: `Boolean`  
Default: `false`  

Requires Sass `>= 3.4` and [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps).  
This option replaces the standard Sass `--sourcemap` option.

*Inline sourcemaps* are recommended, as they "just work".

*File sourcemaps* require you to serve the sourcemap location so the browser can read the files. See the [gulp-sourcemaps readme](https://github.com/floridoo/gulp-sourcemaps) for more info.

```js
'use strict';

var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');

// Inline sourcemaps
gulp.task('sass', function() {
	return sass('source', { sourcemap: true })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('result'));
});

// File sourcemaps
gulp.task('sass', function() {
	return sass('source', { sourcemap: true })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })

	.pipe(sourcemaps.write('maps', {
		includeContent: false,
		sourceRoot: '/source'
	}))

	.pipe(gulp.dest('result'));
});
```

#### container

Type: `String`  
Default: `gulp-ruby-sass`

Name of the temporary directory used to process files. If you're running multiple instances of gulp-ruby-sass at once, you need to specify a separate container for each task to avoid the results being jumbled together.

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('sass-app', function() {
	return sass('source', { container: 'gulp-ruby-sass-app' })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })
	.pipe(gulp.dest('result/app'));
});

gulp.task('sass-site', function() {
	return sass('source', { container: 'gulp-ruby-sass-site' })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })
	.pipe(gulp.dest('result/site'));
});

gulp.task('sass', ['sass-app', 'sass-site']);
```

#### bundleExec

Type: `Boolean`  
Default: `false`

Run `sass` with [bundle exec](http://gembundler.com/man/bundle-exec.1.html): `bundle exec sass`.


### Sass options

All other options are passed directly to the Sass executable.  
For up-to-date options run `sass -h`. The docs below are supplied for convenience.

#### trace

Type: `Boolean`  
Default: `false`

Show a full traceback on error.


#### unixNewlines

Type: `Boolean`  
Default: `false` on Windows, otherwise `true`

Use Unix-style newlines in written files.


#### check

Type: `Boolean`  
Default: `false`

Just check syntax, don't evaluate.


#### style

Type: `String`  
Default: `nested`

Output style. Can be `nested`, `compact`, `compressed`, `expanded`.


#### precision

Type: `Number`  
Default: `3`

How many digits of precision to use when outputting decimal numbers.


#### quiet

Type: `Boolean`  
Default: `false`

Silence warnings and status messages during compilation. **NOTE:** If you set `quiet` to `true` gulp will no longer emit most Sass and Bundler errors.


#### compass

Type: `Boolean`  
Default: `false`

Make Compass imports available and load project configuration (`config.rb` located close to the `gulpfile.js`).


#### debugInfo

Type: `Boolean`  
Default: `false`

Emit output that can be used by the FireSass Firebug plugin.


#### lineNumbers

Type: `Boolean`  
Default: `false`

Emit comments in the generated CSS indicating the corresponding source line.


#### loadPath

Type: `String|Array`

One or more Sass import paths, relative to the gulpfile.


#### require

Type: `String|Array`

Require one or more Ruby libraries before running Sass.


#### cacheLocation

Type: `String`  
Default: `.sass-cache`

The path to put cached Sass files.


#### noCache

Type: `Boolean`  
Default: `false`

Don't cache to sassc files.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
