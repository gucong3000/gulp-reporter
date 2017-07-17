'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const csslint = require('gulp-csslint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('CSSLint', function() {
	this.timeout(10000);
	it('console reporter', done => {
		return vfs.src('test/fixtures/csslint/invalid.css', {
			base: process.cwd(),
			stripBOM: false,
		})
			.pipe(csslint({
				'duplicate-properties': 2
			}))
			.pipe(reporter({
				author: null
			})).on('error', () => {
				const log = sandbox.getLog();
				assert.ok(log.indexOf('test/fixtures/csslint/invalid.css') >= 0);
				assert.ok(log.indexOf('(CSSLint order-alphabetical') >= 0);
				assert.ok(log.indexOf('(CSSLint duplicate-properties') >= 0);
				done();
			});
	});
});
