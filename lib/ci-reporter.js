'use strict';
const path = require('path');
const fs = require('fs-extra');
const got = require('got');
const ci = require('ci-info');
const reportBuilder = require('junit-report-builder');
const url = require('url');
const { URL } = url;
const privatePrefix = ci.isCI && ci.name.replace(/\s*CI$/i, '').toUpperCase() + '_';
const reportPath = path.join.bind(path, getEnv('REPORTS', 'TEST_REPORTS', 'REPORT_PATH') || 'test-reports');
const category = {
	warn: 'Warning',
	info: 'Information',
	error: 'Error',
};

function noop() {
	return Promise.resolve();
}

function appveyor(appveyorApiUrl, errors) {
	errors = errors.map(error => {
		got.post(appveyorApiUrl, {
			body: {
				message: error.message,
				category: category[error.severity] || error.severity,
				details: [error.plugin, error.rule, (error.docShort || error.doc)].filter(Boolean).join(' '),
				fileName: error.fileName,
				line: error.lineNumber,
				column: error.columnNumber,
				projectName: error.plugin,
			},
			json: true,
		});
	});
	return Promise.all(errors);
}

function getEnv(names) {
	names = Array.from(arguments);
	let name;
	let value;
	while ((name = names.pop())) {
		value = (privatePrefix && process.env[privatePrefix + name]) || process.env['CI_' + name] || process.env[name];
		if (value) {
			return value;
		}
	}
}

function junit(errors) {
	const suites = {};
	errors.forEach(function(error) {
		if (suites[error.fileName]) {
			suites[error.fileName].push(error);
		} else {
			suites[error.fileName] = [error];
		}
	});

	const builder = reportBuilder.newBuilder();

	Object.keys(suites).forEach(fileName => {
		const suite = builder.testSuite().name(fileName);
		suites[fileName].forEach(error => {
			const testCase = suite.testCase()
				.name([error.plugin, error.rule].filter(Boolean).join(' '))
				.stacktrace(error.stack);
			if (!error.severity || error.severity === 'error') {
				testCase.error(error.message);
			} else {
				testCase.failure(error.message);
			}
		});
	});

	return fs.outputFile(reportPath('lint-junit-' + Date.now() + '.xml'), builder.build());
}

if (ci.isCI || 1) {

	let appveyorApiUrl = process.env.APPVEYOR_API_URL;
	let reporter;
	if (appveyorApiUrl) {
		if (URL) {
			appveyorApiUrl = new URL('api/build/compilationmessages', appveyorApiUrl).href;
		} else {
			appveyorApiUrl = url.resolve(appveyorApiUrl, 'api/build/compilationmessages');
		}
		reporter = appveyor.bind(null, appveyorApiUrl);
	} else {
		reporter = junit;
	}

	module.exports = function(files) {
		const errors = files.reduce((errors, file) => (
			errors.concat(file.report.errors)
		), []).filter(Boolean);
		if (!errors.length) {
			return noop();
		}
		return reporter(errors)
			.then(() => {});
	};
} else {
	module.exports = noop;
}
