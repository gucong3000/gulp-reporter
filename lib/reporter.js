'use strict';
const browserReporter = require('./browser-reporter');
const formater = require('./formater');
const gutil = require('gulp-util');

function reporter(file, options) {
	function isFail() {
		if (typeof options.fail === 'function') {
			return error => options.fail(error, file);
		} else {
			return error => !error.demote && (!error.severity || error.severity === 'error');
		}
	}
	const errors = file.report.errors;
	if (!errors.length) {
		return;
	}
	if (options.console) {
		const logger = typeof options.console === 'function' ? options.console : gutil.log;
		logger(formater(file, options));
	}
	if (options.browser) {
		browserReporter(file);
	}
	return errors.some(isFail());
}
module.exports = reporter;
