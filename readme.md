# gulp-ruby-sass [![Build Status](https://travis-ci.org/sindresorhus/gulp-ruby-sass.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ruby-sass)

Compiles Sass with the [Sass gem](http://sass-lang.com/install).  
To compile Sass with [libsass](http://libsass.org/), use [gulp-sass](https://github.com/dlmanning/gulp-sass)

## Install

```
$ npm install --save-dev gulp-ruby-sass
```

Requires [Sass >=3.4](http://sass-lang.com/install).

## Important!

- gulp-ruby-sass doesn't support incremental builds yet ([issue](https://github.com/sindresorhus/gulp-ruby-sass/issues/111)).
- gulp-ruby-sass doesn't alter Sass's output in any way. Problems with Sass output should be reported to the [Sass issue tracker](https://github.com/sass/sass/issues).

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

Type: `String`

An object containing plugin and Sass options.

### Plugin options

#### bundleExec

Type: `Boolean`  
Default: `false`

Run Sass with [bundle exec](http://gembundler.com/man/bundle-exec.1.html).

#### sourcemap

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

#### tempDir

Type: `String`  
Default: the system temp directory as reported by [os-tempDir](https://github.com/sindresorhus/os-tmpdir)

This plugin compiles Sass files to a temporary directory before pushing them through the stream. Use `tempDir` to choose an alternate directory if you aren't able to use the default OS temporary directory.

#### emitCompileError

Type: `Boolean`  
Default: `false`

Emit a gulp error when Sass compilation fails.

#### verbose

Type: `Boolean`  
Default: `false`

Log the spawned Sass or Bundler command. Useful for debugging.

### Sass options

Any other options are passed directly to the Sass executable. The options are camelCase versions of Sass's dashed-case options.

The docs below list common options for convenience. Run `sass -h` for the complete list.

#### loadPath

Type: `String` or `Array`  
Default: `false`

Import paths.

#### require

Type: `String`  
Default: `false`

Require a Ruby library before running Sass.

#### compass

Type: `Boolean`  
Default: `false`

Make Compass imports available and load project configuration.

#### style

Type: `String`  
Default: `nested`

Output style. Can be nested (default), compact, compressed, or expanded.

#### force

Type: `Boolean`  
Default: `false`

Recompile every Sass file, even if the CSS file is newer.

#### stopOnError

Type: `Boolean`  
Default: `false`

If a file fails to compile, exit immediately.

#### defaultEncoding

Type: `String`  
Default: `false`

Specify the default encoding for input files.

#### unixNewlines

Type: `Boolean`  
Default: `false`

Use Unix-style newlines in written files on non-Unix systems. Always true on Unix.

#### debugInfo

Type: `Boolean`  
Default: `false`

Emit output that can be used by the FireSass Firebug plugin.

#### lineNumbers

Type: `Boolean`  
Default: `false`

Emit comments in the generated CSS indicating the corresponding source line.

#### check

Type: `Boolean`  
Default: `false`

Just check syntax, don't evaluate.

#### precision 

Type: `Number`  
Default: `5`

How many digits of precision to use when outputting decimal numbers.

#### cacheLocation

Type: `String`  
Default: `false`

The path to save parsed Sass files. Defaults to .sass-cache.

#### noCache

Type: `Boolean`  
Default: `false`

Don't cache parsed Sass files.

#### trace

Type: `Boolean`  
Default: `false`

Show a full Ruby stack trace on error.

#### quiet

Type: `Boolean`  
Default: `false`

Silence warnings and status messages during compilation.

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
