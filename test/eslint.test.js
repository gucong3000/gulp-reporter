'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const vfs = require('vinyl-fs');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const reporter = require('../');

require('./sandbox');

describe('ESLint', function() {
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				filter: function(error) {
					error.toString = error.inspect;
					return error;
				}
			})).on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
			}).on('finish', function() {
				var result = gutil.log.lastCall.args[0].split(/\s*\r?\n\s*/g);
				console.log(result);
				assert.equal(result[0], 'test/fixtures/eslint/invalid.js');
				assert.ok(result.indexOf('[1:1] \u{274C}\u{FE0F} \'a\' is not defined. (ESLint no-undef)') > 0);
				done();
			});
	});

	it('browser reporter', function(done) {
		return vfs.src('test/fixtures/eslint/invalid.js')
			.pipe(eslint())
			.pipe(reporter({
				browser: true
			})).on('data', function(file) {
				var contents = file.contents.toString();
				assert.ok(/\bSyntaxError\b/.test(contents));
				done();
			});
	});
});
