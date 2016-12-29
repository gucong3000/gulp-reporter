const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const gulp = require('gulp');
// const plumber = require('gulp-plumber');
const jscs = require('gulp-jscs');
const reporter = require('../');

require('./sandbox');

describe('JSCS', function() {
	it('console reporter', function(done) {
		return gulp.src('test/fixtures/jscs/invalid.js', {
			base: process.cwd()
		})
			.pipe(jscs({
				configPath: 'test/fixtures/jscs/.jscsrc'
			}))
			.pipe(reporter()).on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/jscs/invalid.js');
			}).on('finish', function() {
				var result = gutil.log.lastCall.args[0].split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/jscs/invalid.js');
				assert.equal(result[1], '[1:8] Multiple var declaration (JSCS disallowMultipleVarDecl)');
				done();
			});
	});
});
