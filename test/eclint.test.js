'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const eclint = require('eclint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('ECLint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			stripBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter({
				author: null,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

				const log = sandbox.getLog();
				assert.ok(log.indexOf('(EditorConfig charset http') >= 0);
				assert.ok(log.indexOf('(EditorConfig indent_style http') >= 0);

				done();
			});
	});
});
