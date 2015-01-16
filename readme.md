# gulp-ruby-sass [![Build Status](https://travis-ci.org/sindresorhus/gulp-ruby-sass.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ruby-sass)

Compiles Sass with [the Sass gem](http://sass-lang.com/install).  
To compile Sass with [libsass](http://libsass.org/), use [gulp-sass](https://github.com/dlmanning/gulp-sass)

## Install

You must have [Sass >= 3.4](http://sass-lang.com/install).

```sh
$ npm install --save-dev gulp-ruby-sass
```

## Important!

- gulp-ruby-sass is a gulp source adapter. Use it instead of `gulp.src`.
- gulp-ruby-sass doesn't support globs yet, only single files or directories. Just like Sass.
- gulp-ruby-sass doesn't support managing errors with plumber yet ([issue](https://github.com/sindresorhus/gulp-ruby-sass/issues/164)).
- gulp-ruby-sass doesn't support incremental builds yet ([issue](https://github.com/sindresorhus/gulp-ruby-sass/issues/111)).
- gulp-ruby-sass doesn't alter Sass's output in any way. Problems with Sass output should be reported to the [Sass issue tracker](https://github.com/sass/sass/issues).

## Usage

Use gulp-ruby-sass instead of `gulp.src` to compile a file or directory.  

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

Handle Sass errors with an `on('error', cb)` listener. gulp-ruby-sass throws errors like a gulp plugin, but streams the erroring files so you can see Sass errors in your browser too.

### Plugin options

#### verbose

Type: `Boolean`  
Default: `false`  

Gives some extra information for debugging, including the actual spawned Sass command.

#### bundleExec

Type: `Boolean`  
Default: `false`

Run `sass` with [bundle exec](http://gembundler.com/man/bundle-exec.1.html).

#### sourcemap

Type: `Boolean`  
Default: `false`  

Requires Sass `>= 3.4` and [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps).  

*Inline sourcemaps* are recommended, as they "just work".

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function() {
	return sass('source', { sourcemap: true })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })

	.pipe(sourcemaps.write())

	.pipe(gulp.dest('result'));
});
```

*File sourcemaps* require you to serve the sourcemap location so the browser can read the files. See the [gulp-sourcemaps readme](https://github.com/floridoo/gulp-sourcemaps) for more info.

```js
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

Name of the temporary directory used to process files. If you're running multiple instances of gulp-ruby-sass at once, specify a separate container for each task to avoid files mixing together.

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('sass-app', function() {
	return sass('source/app.scss', { container: 'gulp-ruby-sass-app' })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })
	.pipe(gulp.dest('result/app'));
});

gulp.task('sass-site', function() {
	return sass('source/site.scss', { container: 'gulp-ruby-sass-site' })
	.on('error', function (err) {
	  console.error('Error', err.message);
   })
	.pipe(gulp.dest('result/site'));
});

gulp.task('sass', ['sass-app', 'sass-site']);
```

### Sass options

Any other options are passed directly to the Sass executable. gulp options are camelCase versions of Sass's dashed-case options.

The docs below list common options for convenience. Run `sass -h` for the complete list.

#### trace

Type: `Boolean`  
Default: `false`

Show a full traceback on error.

#### unixNewlines

Type: `Boolean`  
Default: `false` on Windows, otherwise `true`

Use Unix-style newlines in written files.

####  defaultEncoding

Specify the default encoding for input files. If using special characters on Windows computers you may want to set this to `UTF-8`.

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
