'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const eclint = require('eclint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('ECLint', () => {
	it('console reporter', () => {
		const stream = vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			removeBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter({
				output: true,
				author: null,
			}));
		return sandbox.gotError(stream).then(error => {
			assert.equal(error.plugin, 'gulp-reporter');
			assert.equal(error.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

			const log = sandbox.getLog();
			assert.ok(log.indexOf('(EditorConfig charset http') >= 0);
			assert.ok(log.indexOf('(EditorConfig indent_style http') >= 0);
			assert.ok(/\bdone\(\)/.test(log));
			assert.ok(/@/.test(log));
		});
	});
	it('console reporter without blame', () => {
		const stream = vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			removeBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter({
				output: true,
				blame: false,
			}));
		return sandbox.gotError(stream).then(error => {
			assert.equal(error.plugin, 'gulp-reporter');
			assert.equal(error.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

			const log = sandbox.getLog();
			assert.ok(log.indexOf('(EditorConfig charset http') >= 0);
			assert.ok(log.indexOf('(EditorConfig indent_style http') >= 0);
			assert.equal(/\bdone\(\)/.test(log), false);
			assert.equal(/@/.test(log), false);
		});
	});
});
