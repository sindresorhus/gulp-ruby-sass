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
	var bundleError = 'Gemfile version of Sass not found. Install missing gems with `bundle install`.';
	var command;

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
			var msg = data.toString();

			if (msg.indexOf('bundler: command not found: sass') !== -1) {
				gutil.log('gulp-ruby-sass:', chalk.red(bundleError));
			}
			else {
				gutil.log('gulp-ruby-sass:', msg.replace(new RegExp(compileDir), '').trim());
			}
		});

		sass.stderr.on('data', function (data) {
			var msg = data.toString();

			if (msg.indexOf('Could not find gem') !== -1) {
				gutil.log('gulp-ruby-sass:', chalk.red(bundleError));
			}
			// Handle missing executable errors on close
			else if (msg.indexOf('execvp(): No such file or directory') === -1) {
				gutil.log('gulp-ruby-sass:', msg.trim());
			}
		});

		sass.on('error', function (err) {
			var msg = err.toString();

			// Handle missing executable errors on close
			if (msg.indexOf('spawn ENOENT') === -1) {
				gutil.log('gulp-ruby-sass:', chalk.red(msg));
			}
		});

		sass.on('close', function (code) {
			var dependencies = options.bundleExec ? 'Ruby, Bundler, and Sass' : 'Ruby and Sass';

			if (code === -1) {
				gutil.log('gulp-ruby-sass:', chalk.red('This task requires that ' + dependencies + ' are installed and available.'));
			}

			cb();
		});
	}, { customDir: 'gulp-ruby-sass' });
};

