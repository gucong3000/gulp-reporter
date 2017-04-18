'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const jscs = require('gulp-jscs');
const reporter = require('../');

require('./sandbox');

describe('JSCS', function() {
	it('console reporter', function(done) {
		this.timeout(10000);
		return vfs.src('test/fixtures/jscs/invalid.js', {
			base: process.cwd()
		})
			.pipe(jscs({
				configPath: 'test/fixtures/jscs/.jscsrc'
			}))
			.pipe(reporter({
				filter: null,
			})).on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/jscs/invalid.js');
			}).on('finish', function() {
				const result = gutil.log.lastCall.args[0].split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/jscs/invalid.js');
				assert.ok(/\[\d+\:\d+\]/.test(result[1]));
				assert.ok(/\bMultiple var declaration \(JSCS disallowMultipleVarDecl http:\/\/jscs.info\/rule\/disallowMultipleVarDecl\)/.test(result[1]));
				done();
			});
	});
});
