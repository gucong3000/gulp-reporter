const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const gulp = require('gulp');
// const plumber = require('gulp-plumber');
const jshint = require('gulp-jshint');
const reporter = require('../');

require('./sandbox');

describe('JSHint', function() {
	it('console reporter', function(done) {
		return gulp.src('test/fixtures/jshint/invalid.js', {
			base: process.cwd()
		})
			.pipe(jshint())
			.pipe(reporter()).on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/jshint/invalid.js');
			}).on('finish', function() {
				assert.ok(/^test\/fixtures\/jshint\/invalid.js\n/.test(gutil.log.lastCall.args[0]));
				assert.ok(/\s+\[\d+\:\d+\] Missing semicolon. \(JSHint W033\)\n/.test(gutil.log.lastCall.args[0]));
				done();
			});
	});
});
