const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const gulp = require('gulp');
// const plumber = require('gulp-plumber');
const tslint = require('gulp-tslint');
const reporter = require('../');

require('./sandbox');

describe('tslint', function() {
	it('console reporter', function(done) {
		return gulp.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd()
		})
			.pipe(tslint())
			.pipe(reporter())

			.on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
			}).on('finish', function() {
				assert.ok(/^test\/fixtures\/tslint\/invalid.ts\n/.test(gutil.log.lastCall.args[0]));
				assert.ok(/\s+\[\d+\:\d+\] missing whitespace \(TSLint one-line\)\n/.test(gutil.log.lastCall.args[0]));
				assert.ok(/\s+\[\d+\:\d+\] missing whitespace \(TSLint whitespace\)\n/.test(gutil.log.lastCall.args[0]));
				done();
			});
	});
});
