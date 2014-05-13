# gulp-ruby-sass [![Build Status](https://travis-ci.org/sindresorhus/gulp-ruby-sass.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ruby-sass)

> Compile Sass to CSS with [Ruby Sass](http://sass-lang.com/install)

This is slower than [gulp-sass](https://github.com/dlmanning/gulp-sass), but more stable and feature-rich.

*Issues with the output should be reported on the Sass [issue tracker](https://github.com/nex3/sass/issues).*


## Install

```sh
$ npm install --save-dev gulp-ruby-sass
```

You also need to have [Ruby](http://www.ruby-lang.org/en/downloads/) and [Sass](http://sass-lang.com/download.html) installed. If you're on OS X or Linux you probably already have Ruby; test with `ruby -v` in your terminal. When you've confirmed you have Ruby, run `gem install sass` to install Sass.


## Usage

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('default', function () {
	return gulp.src('src/app.scss')
		.pipe(sass({sourcemap: true}))
		.pipe(gulp.dest('dist'));
});
```


## API

Note that files starting with `_` are ignored even if they match the globbing pattern.  
This is done to match the expected [Sass partial behaviour](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#partials).


### sass(options)

#### options


##### sourcemap

Type: `Boolean`  
Default: `false`

Enable Source Map.

**Requires Sass 3.3.0**


##### trace

Type: `Boolean`  
Default: `false`

Show a full traceback on error.


##### unixNewlines

Type: `Boolean`  
Default: `false` on Windows, otherwise `true`

Force Unix newlines in written files.


##### check

Type: `Boolean`  
Default: `false`

Just check syntax, don't evaluate.


##### style

Type: `String`  
Default: `nested`

Output style. Can be `nested`, `compact`, `compressed`, `expanded`.


##### precision

Type: `Number`  
Default: `3`

How many digits of precision to use when outputting decimal numbers.


##### quiet

Type: `Boolean`  
Default: `false`

Silence warnings and status messages during compilation.


##### compass

Type: `Boolean`  
Default: `false`

Make Compass imports available and load project configuration (`config.rb` located close to the `gulpfile.js`).


##### debugInfo

Type: `Boolean`  
Default: `false`

Emit extra information in the generated CSS that can be used by the FireSass Firebug plugin.


##### lineNumbers

Type: `Boolean`  
Default: `false`

Emit comments in the generated CSS indicating the corresponding source line.


##### loadPath

Type: `String|Array`

Add a (or multiple) Sass import path.


##### require

Type: `String|Array`

Require a (or multiple) Ruby library before running Sass.


##### cacheLocation

Type: `String`  
Default: `.sass-cache`

The path to put cached Sass files.


##### noCache

Type: `Boolean`  
Default: `false`

Don't cache to sassc files.


##### bundleExec

Type: `Boolean`  
Default: `false`

Run `sass` with [bundle exec](http://gembundler.com/man/bundle-exec.1.html): `bundle exec sass`.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
