'use strict';
const path = require('path');
const fs = require('fs-extra');
const got = require('got');
const ci = require('ci-info');

const { URL } = require('url');
const privatePrefix = ci.isCI && ci.name.replace(/\s*CI$/i, '').toUpperCase() + '_';
const reportPath = path.join(getEnv('TEST_REPORTS') || getEnv('REPORT_PATH') || 'test-reports', 'lint-junit-' + (getEnv('BUILD_ID') || getEnv('BUILD_NUM') || Date.now()) + '.xml');
const category = {
	warn: 'Warning',
	info: 'Information',
	error: 'Error',
};

function noop() {
	return Promise.resolve();
}

function xmlEscape(s) {
	return (`${s}`).replace(/[<>&"'\x00-\x1F\x7F\u0080-\uFFFF]/g, c => { // eslint-disable-line no-control-regex
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case '"':
				return '&quot;';
			case "'":
				return '&apos;';
			default:
				return `&#${c.charCodeAt(0)};`;
		}
	});
}
function appveyor(errors) {
	errors = errors.map(error => {
		got.post(appveyorApiUrl, {
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
	return Promise.all(errors);
}

function getEnv(name) {
	return (privatePrefix && process.env[privatePrefix + '_' + name]) || process.env['CI_' + name] || process.env[name];
}

function junit(errors) {
	const testsuites = {};
	errors.forEach(function(error) {
		if (testsuites[error.fileName]) {
			testsuites[error.fileName].push(error);
		} else {
			testsuites[error.fileName] = [error];
		}
	});

	let output = '<?xml version="1.0" encoding="utf-8"?>\n';
	output += '<testsuites>\n';

	output += Object.keys(testsuites).map(fileName => {
		let failures = 0;
		const testcases = testsuites[fileName].map(error => {
			let type;
			if (error.severity === 'error') {
				type = 'error';
			} else {
				type = 'failure';
				failures++;
			}
			const message = error.message && xmlEscape(error.message) || '';
			let output = `<testcase time="0" name="${[error.plugin, error.rule].filter(Boolean).join(' ')}">`;
			output += `<${type} message="${message}">`;
			output += '<![CDATA[';
			output += `line ${error.lineNumber || 0}, col `;
			output += `${error.columnNumber || 0}, ${category[error.severity] || error.severity}`;
			output += ` - ${message}`;
			output += ` (${[error.plugin, error.rule, error.doc].filter(Boolean).join(' ')})`;
			output += ']]>';
			output += `</${type}>`;
			output += '</testcase>\n';
			return output;
		});
		let output = `<testsuite time="0" name="${fileName}" tests="${testcases.length}" errors="${testcases.length - failures}" failures="${failures}">\n`;
		output += testcases.join('\n');
		output += '\n</testsuite>';
		return output;
	}).join('\n');
	output += '\n</testsuites>\n';

	return fs.outputFile(reportPath, output);
}

let appveyorApiUrl = process.env.APPVEYOR_API_URL;

if (appveyorApiUrl) {
	appveyorApiUrl = new URL('api/build/compilationmessages', appveyorApiUrl).href;
	module.exports = appveyor;
} else if (ci.isCI) {
	module.exports = junit;
} else {
	module.exports = noop;
}
