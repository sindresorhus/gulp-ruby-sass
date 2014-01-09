# [gulp](https://github.com/wearefractal/gulp)-ruby-sass [![Build Status](https://secure.travis-ci.org/sindresorhus/gulp-ruby-sass.png?branch=master)](http://travis-ci.org/sindresorhus/gulp-ruby-sass)

> Compile Sass to CSS with [Ruby Sass](http://sass-lang.com/install)

This is slower than [grunt-sass](https://github.com/dlmanning/gulp-sass), but more stable and feature-rich.


## Install

Install with [npm](https://npmjs.org/package/gulp-ruby-sass)

```
npm install --save-dev gulp-ruby-sass
```


## Example

```js
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('default', function () {
	gulp.src('src/app.scss')
		.pipe(sass())
		.pipe(gulp.dest('dist'));
});
```


## API

### sass(options)

Same [options](https://github.com/gruntjs/grunt-contrib-sass#options) as grunt-contrib-sass.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
