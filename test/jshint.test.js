'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const jshint = require('gulp-jshint');
const reporter = require('../');

require('./sandbox');

describe('JSHint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/jshint/invalid.js', {
			base: process.cwd()
		})
			.pipe(jshint())
			.pipe(reporter({
				author: null
			})).on('error', done).on('finish', () => {
				assert.ok(/^test\/fixtures\/jshint\/invalid.js\n/.test(gutil.log.lastCall.args[0]));
				assert.ok(/\s+\[\d+:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(/\(JSHint W033\)\n/.test(gutil.log.lastCall.args[0]));
				done();
			});
	});
});
