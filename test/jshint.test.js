'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const jshint = require('gulp-jshint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('JSHint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/jshint/invalid.js', {
			base: process.cwd()
		})
			.pipe(jshint())
			.pipe(reporter({
				author: null
			})).on('error', done).on('finish', () => {
				assert.ok(/^test\/fixtures\/jshint\/invalid.js\n/.test(sandbox.getLog()));
				assert.ok(/\s+\[\d+:\d+\]/.test(sandbox.getLog()));
				assert.ok(/\(JSHint W033\)\n/.test(sandbox.getLog()));
				done();
			});
	});
});
