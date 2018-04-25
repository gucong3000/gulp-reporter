'use strict';
const proxyquire = require('proxyquire');
const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const env = process.env;

describe('CI', () => {
	const mkdtemp = fs.mkdtemp.bind(fs, path.join(os.tmpdir(), 'gulp-reporter-ci-'));
	let tempDir;

	function getResult (fileName) {
		return fs.readdir(tempDir).then(items => (
			Promise.all(items.map(item => (
				fs.readFile(path.join(tempDir, item, fileName), 'utf-8')
			)))
		));
	}

	beforeEach(() => {
		return mkdtemp().then(temp => {
			tempDir = temp;
		});
	});

	afterEach(() => {
		if (tempDir) {
			return fs.remove(tempDir).then(() => {
				tempDir = null;
			});
		}
	});

	after(() => {
		process.env = env;
	});

	it('is not CI', () => {
		process.env = {
			CI_REPORTS: tempDir,
		};
		const ciReporter = proxyquire('../lib/ci-reporter', {
			'ci-info': {
				isCI: false,
				CIRCLE: false,
				APPVEYOR: false,
				JENKINS: false,
			},
		});

		return ciReporter().then(() => (
			getResult('lint-result.xml')
		)).then(results => {
			assert.equal(results.length, 0);
		});
	});

	it('CircleCI v1', () => {
		process.env = {
			CI: true,
			CIRCLE_TEST_REPORTS: tempDir,
		};
		return proxyquire('../lib/ci-reporter', {
			'ci-info': {
				name: 'CircleCI',
				CIRCLE: true,
				isCI: true,
				APPVEYOR: false,
				JENKINS: false,
			},
		})([{
			report: {
				errors: [
					new Error('_'),
				],
			},
		}]).then(() => (
			getResult('lint-result.xml')
		)).then(results => {
			assert.equal(results.length, 1);
			assert.ok(results[0]);
		});
	});

	it('Jenkins', () => {
		process.env = {
			CI: true,
			CI_REPORTS: tempDir,
			JENKINS_HOME: tempDir,
		};
		return proxyquire('../lib/ci-reporter', {
			'ci-info': {
				name: 'Jenkins',
				JENKINS: true,
				isCI: true,
				CIRCLE: false,
				APPVEYOR: false,
			},
			'./has-checkstyle': true,
		})([{
			report: {
				errors: [
					new Error('_'),
				],
			},
		}]).then(() => (
			getResult('checkstyle-result.xml')
		)).then(results => {
			assert.equal(results.length, 1);
			assert.ok(results[0]);
		});
	});
});
