'use strict';
var path = require('path');
var dargs = require('dargs');
var gutil = require('gulp-util');
var spawn = require('win-spawn');
var execSync = require('execSync');
var intermediate = require('gulp-intermediate');

module.exports = function (options) {
	var compileDir = '_14139e58-9ebe-4c0f-beca-73a65bb01ce9';
	options = options || {};
	options.cacheLocation = options.cacheLocation || path.join(__dirname, '.sass-cache');
	options.update = '.:' + compileDir;
	var args = dargs(options, ['bundleExec']);
	var command;
	var existsCommand;

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
	}, { customDir: 'gulp-ruby-sass' });
};

