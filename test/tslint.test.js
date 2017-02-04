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
				var result = gutil.log.lastCall.args[0].split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/tslint/invalid.ts');
				assert.ok(result.indexOf('[1:9] \u{274C}\u{FE0F} missing whitespace (TSLint one-line)') > 0);
				assert.ok(result.indexOf('[1:15] \u{274C}\u{FE0F} missing whitespace (TSLint whitespace)') > 0);
				done();
			});
	});
	it('fail function', function(done) {
		var error;
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
