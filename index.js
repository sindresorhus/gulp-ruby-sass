'use strict';
var uuid = require('uuid');
var dargs = require('dargs');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var execSync = require('execSync');
var intermediate = require('gulp-intermediate');

module.exports = function (options) {
	options = options || {};
	var args = dargs(options, ['bundleExec']);
	var compileDir = '_' + uuid.v4();
	var command;
	var existsCommand;
	args.push('--update', '.:' + compileDir);

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
		existsCommand = 'bundle exec sass -v';
	}
	else {
		command = 'sass';
		existsCommand = 'sass -v';
	}

	var result = execSync.exec(existsCommand);

	if (result.code !== 0) {
		throw new gutil.PluginError('gulp-ruby-sass', result.stdout);
	}

	// TODO: Add persistant temp directory and caching.

	return intermediate(compileDir, function(tempDir, cb) {
		if (process.argv.indexOf('--verbose') !== -1) {
			gutil.log('gulp-ruby-sass:', 'Running command:',
								gutil.colors.blue(command, args.join(' ')));
		}

		var sass = spawn(command, args, {cwd: tempDir});

		sass.stdout.on('data', function (data) {
			gutil.log('gulp-ruby-sass:', data.toString()
										.replace(new RegExp(compileDir), '') // Remove tmp directory
										.replace(/\s+$/g, ''));							 // Remove extra newlines
		});

		sass.stderr.on('data', function (data) {
			gutil.log('gulp-ruby-sass:', gutil.colors.red('Sass error: ') + data);
		});

		sass.on('close', cb);
	});
};

