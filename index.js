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

		sass.on('error', function (err) {
			gutil.log('gulp-ruby-sass:', chalk.red('Error running Sass: \n') +
				'Something went wrong while trying to run the Sass command.\n' +
				'Make sure you have Ruby and Sass installed and available.\n' +
				'Original error: ' + err);
			cb();
		});

		sass.stdout.on('data', function (data) {
			gutil.log('gulp-ruby-sass:', data.toString()
				.replace(new RegExp(compileDir), '') // Remove tmp directory
				.replace(/\s+$/g, ''));							 // Remove extra newlines
		});

		sass.stderr.on('data', function (data) {
			gutil.log('gulp-ruby-sass:', chalk.red('Sass error: ') + data);
		});

		sass.on('close', cb);
	}, { customDir: 'gulp-ruby-sass' });
};

