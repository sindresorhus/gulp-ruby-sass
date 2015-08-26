# gulp-ruby-sass [![Build Status](https://travis-ci.org/sindresorhus/gulp-ruby-sass.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ruby-sass)

Compiles Sass with the [Sass gem](http://sass-lang.com/install) and pipes the results into a gulp stream.  
To compile Sass with [libsass](http://libsass.org/), use [gulp-sass](https://github.com/dlmanning/gulp-sass)

## Install

```
$ npm install --save-dev gulp-ruby-sass
```

Requires [Sass >=3.4](http://sass-lang.com/install).

## Usage

### sass(source, options)

Use gulp-ruby-sass *instead of `gulp.src`* to compile Sass files.

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('sass', function () {
  return sass('source/')
    .on('error', sass.logError)
    .pipe(gulp.dest('result'));
});
```

#### source

Type: `String`

A directory or file to compile. Note gulp-ruby-sass does not use globs. It only accepts the input values that Ruby Sass accepts.

#### options

Type: `Object`

An object containing plugin and Sass options. Available options include:

##### bundleExec

Type: `Boolean`  
Default: `false`

Run Sass with [bundle exec](http://gembundler.com/man/bundle-exec.1.html).

##### sourcemap

Type: `Boolean`  
Default: `false`

Initialize and pass Sass sourcemaps to [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps). Note this option replaces Sass's `sourcemap` option.

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function () {
  return sass('source', {sourcemap: true})
    .on('error', sass.logError)

    // For inline sourcemaps
    .pipe(sourcemaps.write())

    // For file sourcemaps
    .pipe(sourcemaps.write('maps', {
      includeContent: false,
      sourceRoot: 'source'
    }))

    .pipe(gulp.dest('result'));
});
```

##### tempDir

Type: `String`  
Default: the system temp directory as reported by [os-tempDir](https://github.com/sindresorhus/os-tmpdir)

This plugin compiles Sass files to a temporary directory before pushing them through the stream. Use `tempDir` to choose an alternate directory if you aren't able to use the default OS temporary directory.

##### emitCompileError

Type: `Boolean`  
Default: `false`

Emit a gulp error when Sass compilation fails.

##### verbose

Type: `Boolean`  
Default: `false`

Log the spawned Sass or Bundler command. Useful for debugging.

##### Sass options

Any additional options are passed directly to the Sass executable. Options are camelCase versions of Sass's options (parsed by [dargs](https://github.com/sindresorhus/dargs)).

Run `sass -h` for a complete list of Sass options.

```js
gulp.task('sass', function () {
  return sass('source/', {
      precision: 6,
      stopOnError: true,
      cacheLocation: './',
      loadPath: [ 'library', '../../shared-components' ]
    })
    .on('error', sass.logError)
    .pipe(gulp.dest('result'));
});
```

### sass.clearCache([source, tempDir, done])

To enable Sass caching this plugin must keep a cache of each task's compiled files in a temporary directory. 

Usually this works with no further user input. BUT, if you're compiling a directory and rename or delete source files you will need to run the `clearCache` function to prevent stale files from being piped through the stream.

```js
var sass = require('gulp-ruby-sass');

gulp.task('sass-theme', function () {
  return sass('theme/source').pipe(gulp.dest('result'));
});

gulp.task('sass-app', function () {
  return sass('app/source').pipe(gulp.dest('result'));
});

gulp.task('clear-theme-cache', function () {
  return sass.clearCache('theme/source');
});

gulp.task('clear-all-caches', function () {
  return sass.clearCache();
});
```

#### source

Type: `string`

The source of the task who's cache should be cleared. If no source is given `clearCache` will delete the cache for all gulp-ruby-sass tasks run from the current directory.

#### tempDir

Type: `string`

If a gulp-ruby-sass task has the [`tempDir`](#tempdir) option set it must be passed to `clearCache`.

#### done

Type: `function`

Pass a `done` callback to make the `clearCache` function asynchronous. If no function is provided the sync version of `clearCache` will be used.

## Issues

This plugin wraps the Sass gem for the gulp build system. It does not alter Sass's output in any way. Any issues with Sass output should be reported to the [Sass issue tracker](https://github.com/sass/sass/issues).

gulp-ruby-sass doesn't support Sass caching or incremental builds yet ([issue](https://github.com/sindresorhus/gulp-ruby-sass/issues/111)).

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
