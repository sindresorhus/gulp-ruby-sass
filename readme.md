# gulp-ruby-sass [![Build Status](https://travis-ci.org/sindresorhus/gulp-ruby-sass.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ruby-sass)

Compiles Sass with the [Sass gem](http://sass-lang.com/install) and pipes the results into a gulp stream.<br>
To compile Sass with [libsass](http://libsass.org/), use [gulp-sass](https://github.com/dlmanning/gulp-sass)


---

<p align="center"><b>⚛ Learn React in just a couple of afternoons with this awesome <a href="https://ReactForBeginners.com/friend/AWESOME">React course</a> by Wes Bos</b></p>

---


## Install

```
$ npm install --save-dev gulp-ruby-sass
```

Requires [Sass >=3.4](http://sass-lang.com/install).


## Usage

### sass(source, [options])

Use gulp-ruby-sass *instead of `gulp.src`* to compile Sass files.

```js
const gulp = require('gulp');
const sass = require('gulp-ruby-sass');

gulp.task('sass', () =>
	sass('source/file.scss')
		.on('error', sass.logError)
		.pipe(gulp.dest('result'))
);
```

#### source

Type: `string` `string[]`

File or glob pattern (`source/**/*.scss`) to compile. Ignores files prefixed with an underscore. **Directory sources are not supported.**

#### options

Type: `Object`

Object containing plugin and Sass options.

##### bundleExec

Type: `boolean`<br>
Default: `false`

Run Sass with [bundle exec](http://gembundler.com/man/bundle-exec.1.html).

##### sourcemap

Type: `boolean`<br>
Default: `false`

Initialize and pass Sass sourcemaps to [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps). Note this option replaces Sass's `sourcemap` option.

```js
const gulp = require('gulp');
const sass = require('gulp-ruby-sass');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', () =>
	sass('source/file.scss', {sourcemap: true})
		.on('error', sass.logError)
		// for inline sourcemaps
		.pipe(sourcemaps.write())
		// for file sourcemaps
		.pipe(sourcemaps.write('maps', {
			includeContent: false,
			sourceRoot: 'source'
		}))
		.pipe(gulp.dest('result'))
);
```

##### base

Type: `string`

Identical to `gulp.src`'s [`base` option](https://github.com/gulpjs/gulp/blob/master/docs/API.md#optionsbase).

##### tempDir

Type: `string`<br>
Default: System temp directory

This plugin compiles Sass files to a temporary directory before pushing them through the stream. Use `tempDir` to choose an alternate directory if you aren't able to use the default OS temporary directory.

##### emitCompileError

Type: `boolean`<br>
Default: `false`

Emit a gulp error when Sass compilation fails.

##### verbose

Type: `boolean`<br>
Default: `false`

Log the spawned Sass or Bundler command. Useful for debugging.

##### Sass options

Any additional options are passed directly to the Sass executable. The options are camelCase versions of Sass's options parsed by [`dargs`](https://github.com/sindresorhus/dargs).

Run `sass -h` for a complete list of Sass options.

```js
gulp.task('sass', () =>
	sass('source/file.scss', {
			precision: 6,
			stopOnError: true,
			cacheLocation: './',
			loadPath: [ 'library', '../../shared-components' ]
		})
		.on('error', sass.logError)
		.pipe(gulp.dest('result'))
);
```

### sass.logError(err)

Convenience function for pretty error logging.

### sass.clearCache([tempDir])

In rare cases you may need to clear gulp-ruby-sass's cache. This sync function deletes all files used for Sass caching. If you've set a custom temporary directory in your task you must pass it to `clearCache`.


## Issues

This plugin wraps the Sass gem for the gulp build system. It does not alter Sass's output in any way. Any issues with Sass output should be reported to the [Sass issue tracker](https://github.com/sass/sass/issues).

Before submitting an issue please read the [contributing guidelines](https://github.com/sindresorhus/gulp-ruby-sass/blob/master/contributing.md).


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
