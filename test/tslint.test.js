'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const tslint = require('gulp-tslint');
const reporter = require('../');

require('./sandbox');

describe('TSLint', function() {
	this.timeout(10000);
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd()
		})
			.pipe(tslint())
			.pipe(reporter({
				filter: null
			}))

			.on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/tslint/invalid.ts');
				assert.ok(/\s+\[\d+\:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('missing whitespace (TSLint one-line https://palantir.github.io/tslint/rules/one-line/)') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('missing whitespace (TSLint whitespace https://palantir.github.io/tslint/rules/whitespace/)') >= 0);
				done();
			});
	});
	it('fail function', function(done) {
		let error;
		return vfs.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd()
		})
			.pipe(tslint())
			.pipe(reporter({
				filter: null,
				fail: function() {
					return false;
				}
			}))

			.on('error', function(ex) {
				error = error || ex;
			}).on('finish', function() {
				assert.ok(!error);
				done();
			});
	});
});
