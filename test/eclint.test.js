'use strict';
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const eclint = require('eclint');
const reporter = require('../');

require('./sandbox');

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

				assert.ok(gutil.log.lastCall.args[0].indexOf('(EditorConfig charset http') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('(EditorConfig indent_style http') >= 0);

				done();
			});
	});
});
