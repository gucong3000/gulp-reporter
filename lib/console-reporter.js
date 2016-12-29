'use strict';
const gutil = require('gulp-util');
const path = require('path');

function consoleReporter(file, logger) {
	var errors = file.report.errors.map(err => err.toString().replace(/(^|\r?\n)/g, '$1\t'));
	errors.unshift(gutil.colors.cyan.underline(path.relative(file.cwd, file.path).replace(/\\/g, '/')));
	(logger || gutil.log)(errors.join('\n').replace(/\t/g, '    '));
}

module.exports = consoleReporter;
