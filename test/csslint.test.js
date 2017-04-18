'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const csslint = require('gulp-csslint');
const reporter = require('../');

require('./sandbox');

describe('CSSLint', function() {
	this.timeout(10000);
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/csslint/invalid.css', {
			base: process.cwd(),
			stripBOM: false,
		})
			.pipe(csslint())
			.pipe(reporter({
				filter: null
			})).on('finish', () => {
				assert.ok(gutil.log.lastCall.args[0].indexOf('test/fixtures/csslint/invalid.css') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('(CSSLint order-alphabetical') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('(CSSLint duplicate-properties') >= 0);
				done();
			});
	});
});
