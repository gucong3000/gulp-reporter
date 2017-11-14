'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const jshint = require('gulp-jshint');
const reporter = require('../');
const sandbox = require('./sandbox');
const proxyquire = require('proxyquire');

describe('JSHint', () => {
	it('JSHintError', () => {
		const JSHintError = proxyquire('../lib/jshint-error', {
			'./lint-error': proxyquire('../lib/lint-error', {
				'./locale': 'zh_CN',
			}),
		});
		const error = new JSHintError({
			message: 'tesecase',
			file: __filename,
		});
		assert.equal(error.message, 'tesecase');
		const error2 = new JSHintError({
			raw: "Unreachable '{a}' after '{b}'.",
			message: 'tesecase',
			file: __filename,
		});
		assert.notEqual(error2.message, 'tesecase');
	});

	it('console reporter', done => {
		return vfs.src('test/fixtures/jshint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(jshint())
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', () => {
				const log = sandbox.getLog();
				assert.ok(/^test\/fixtures\/jshint\/invalid.js$/m.test(log));
				assert.ok(/\s+\d+:\d+/.test(log));
				assert.ok(/\(JSHint W033\)$/m.test(log));
				done();
			});
	});
});
