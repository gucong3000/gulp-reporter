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
			})).on('error', () => {
				const log = sandbox.getLog();
				assert.ok(/^test\/fixtures\/jshint\/invalid.js$/m.test(log));
				assert.ok(/\s+\d+:\d+/.test(log));
				assert.ok(/\(JSHint W033\)$/m.test(log));
				done();
			});
	});
});
