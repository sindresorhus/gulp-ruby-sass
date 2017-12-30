'use strict';
const escapeStringRegexp = require('escape-string-regexp');
const fancyLog = require('fancy-log');
const emitErr = require('./utils').emitErr;

const logger = {};

// Remove intermediate directory for more Sass-like logging
logger.prettifyDirectoryLogging = (msg, intermediateDir) => {
	const escapedDir = escapeStringRegexp(intermediateDir);
	return msg.replace(new RegExp(`${escapedDir}/?`, 'g'), './');
};

// TODO: Now that we've standardized on --update, remove parsing that only
// applies to single, non update compilations.

logger.verbose = (command, args) => {
	fancyLog(`Running command ${command} ${args.join(' ')}`);
};

logger.stdout = (stream, intermediateDir, data) => {
	// Bundler error: no Sass version found
	if (/bundler: command not found: sass/.test(data)) {
		emitErr(stream, 'bundler: command not found: sass');
	} else if (/Could not locate Gemfile or .bundle\/ directory/.test(data)) { // Bundler error: Gemfile not found
		emitErr(stream, 'bundler: could not locate Gemfile or .bundle directory');
	} else if (/No such file or directory @ rb_sysopen/.test(data)) { // Sass error: directory missing
		emitErr(stream, data.trim());
	} else { // Not an error: Sass logging
		data = logger.prettifyDirectoryLogging(data, intermediateDir);
		data = data.trim();
		fancyLog(data);
	}
};

logger.stderr = (stream, intermediateDir, data) => {
	const bundlerMissing = /Could not find 'bundler' \((.*?)\)/.exec(data);
	const sassVersionMissing = /Could not find gem 'sass \((.*?)\) ruby'/.exec(data);

	// Ruby error: Bundler gem not installed
	if (bundlerMissing) {
		emitErr(stream, `ruby: Could not find 'bundler' (${bundlerMissing[1]})`);
	} else if (sassVersionMissing) { // Bundler error: no matching Sass version
		emitErr(stream, `bundler: Could not find gem 'sass (${sassVersionMissing[1]})'`);
	} else if (/No such file or directory @ rb_sysopen/.test(data)) { // Sass error: file missing
		emitErr(stream, data.trim());
	} else { // Not an error: Sass warnings, debug statements
		data = logger.prettifyDirectoryLogging(data, intermediateDir);
		data = data.trim();
		fancyLog(data);
	}
};

logger.error = (stream, err) => {
	if (err.code === 'ENOENT') {
		// Spawn error: gems not installed
		emitErr(stream, `Gem ${err.path} is not installed`);
	} else {
		// Other errors
		emitErr(stream, err);
	}
};

module.exports = logger;
