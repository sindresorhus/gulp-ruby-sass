'use strict';
var path = require('path');
var chalk = require('chalk');
var dargs = require('dargs');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var intermediate = require('gulp-intermediate');

module.exports = function (options) {
	var compileDir = '_14139e58-9ebe-4c0f-beca-73a65bb01ce9';
	options = options || {};
	options.cacheLocation = options.cacheLocation || path.join(__dirname, '.sass-cache');
	options.update = '.:' + compileDir;
	var args = dargs(options, ['bundleExec']);
	var command;

	// Error handling
	var noLogMatcher = /execvp\(\): No such file or directory|spawn ENOENT/;
	var bundleErrMatcher = /bundler: command not found|Could not find gem/;
	var bundleErr = chalk.red('Gemfile version of Sass not found. Install missing gems with `bundle install`.');

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	}
	else {
		command = 'sass';
	}

	return intermediate(compileDir, function(tempDir, cb) {
		if (process.argv.indexOf('--verbose') !== -1) {
			gutil.log('gulp-ruby-sass:', 'Running command:',
				chalk.blue(command, args.join(' ')));
		}

		var sass = spawn(command, args, {cwd: tempDir});

		sass.stdout.on('data', function (data) {
			var msg = data.toString().trim();

			if (bundleErrMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', bundleErr);
			}
			else {
				gutil.log('gulp-ruby-sass:', msg.replace(new RegExp(compileDir), ''));
			}
		});

		sass.stderr.on('data', function (data) {
			var msg = data.toString().trim();

			if (bundleErrMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', bundleErr);
			}
			else if (!noLogMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', msg);
			}
		});

		sass.on('error', function (err) {
			var msg = err.toString().trim();

			if (!noLogMatcher.test(msg)) {
				gutil.log('gulp-ruby-sass:', chalk.red(msg));
			}
		});

		sass.on('close', function (code) {
			var dependencies = options.bundleExec ? 'Ruby, Bundler, and Sass' : 'Ruby and Sass';

			if (code === -1) {
				gutil.log('gulp-ruby-sass:', chalk.red('Missing dependencies. ' + dependencies + ' must be installed and available.'));
			}

			cb();
		});
	}, { customDir: 'gulp-ruby-sass' });
};

