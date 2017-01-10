'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const jshint = require('gulp-jshint');
const reporter = require('../');

require('./sandbox');

describe('JSHint', function() {
	it('console reporter', function(done) {
		this.timeout(10000);
		return vfs.src('test/fixtures/jshint/invalid.js')
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
