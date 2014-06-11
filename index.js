'use strict';
var uuid = require('uuid');
var dargs = require('dargs');
var which = require('which');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var intermediate = require('gulp-intermediate');

module.exports = function (options) {
	options = options || {};
	var args = dargs(options, ['bundleExec']);
	var compileDir = '_' + uuid.v4();
	var command;

	try {
		if (options.bundleExec) {
			// TODO: Test Sass availability under bundle exec.
		}
		else {
			which.sync('sass');
		}
	}
  catch (err) {
		throw new gutil.PluginError('gulp-ruby-sass', 'You need to have Ruby and Sass installed and in your PATH for this task to work.');
	}

	if (options.bundleExec) {
		command = 'bundle';
		args.unshift('exec', 'sass');
	}
	else {
		command = 'sass';
	}

	args.push('--update', '.:' + compileDir);

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

