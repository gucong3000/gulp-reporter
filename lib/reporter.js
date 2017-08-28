'use strict';
const browserReporter = require('./browser-reporter');
const formatter = require('./formatter');
const got = require('got');
const { URL } = require('url');

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
	const writable = options.output;
	if (writable) {
		writable(formatter(file, options));
	}
	if (options.browser) {
		browserReporter(file);
	}
	const appveyorApiUrl = process.env.APPVEYOR_API_URL;
	if (appveyorApiUrl) {

		const myURL = new URL('api/build/compilationmessages', appveyorApiUrl);
		const category = {
			warn: 'warning',
			info: 'information',
		};
		errors.map(error => {
			got.post(myURL.href, {
				body: {
					'message': error.message,
					'category': category[error.severity] || error.severity,
					'details': [error.plugin, error.rule, (error.docShort || error.doc)].filter(Boolean).join(' '),
					'fileName': error.fileName,
					'line': error.lineNumber,
					'column': error.columnNumber,
				},
				json: true,
			});
		});
	}
	return errors.some(isFail());
}
module.exports = reporter;
