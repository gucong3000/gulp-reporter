'use strict';
const consoleReporter = require('./console-reporter');
const browserReporter = require('./browser-reporter');
function reporter(file, options) {
	function isFail(error) {
		if (typeof options.fail === 'function') {
			return options.fail(error, file);
		} else {
			return !error.severity || error.severity === 'error';
		}
	}
	var errors = file.report.errors;
	if (!errors.length) {
		return;
	}
	if (options.console) {
		consoleReporter(file, typeof options.console === 'function' ? options.console : null);
	}
	if (options.browser) {
		browserReporter(file);
	}
	return errors.some(isFail);
}
module.exports = reporter;
