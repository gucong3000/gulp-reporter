'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const vfs = require('vinyl-fs');
const gutil = require('gulp-util');
const eclint = require('eclint');
const reporter = require('../');

// require('./sandbox');

describe('ECLint', function() {
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eclint.check())
			.pipe(reporter()).on('error', ex => {
				console.error(ex);
				// assert.equal(ex.plugin, 'gulp-reporter');
				// assert.equal(ex.message, 'Lint failed for: test/fixtures/eclint/invalid.js');
				// var result = gutil.log.lastCall.args[0].split(/\r?\n/g);
				// assert.equal(result[0], 'test/fixtures/eclint/invalid.js');
				// console.log(result);
				done();
			});
	});
});
