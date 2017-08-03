'use strict';
const browserReporter = require('./browser-reporter');
const formatter = require('./formatter');
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
	let writable = options.output;
	if (writable) {
		if (typeof writable.write === 'function') {
			writable = writable.write.bind(writable);
		} else if (typeof writable !== 'function') {
			writable = gutil.log;
		}
		writable(formatter(file, options));
	}
	if (options.browser) {
		browserReporter(file);
	}
	return errors.some(isFail());
}
module.exports = reporter;
