'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const gulpTslint = require('gulp-tslint');
const tslint = require('tslint');
const reporter = require('../');

require('./sandbox');

describe('TSLint', function() {
	this.timeout(10000);
	it('console reporter', done => {
		return vfs.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd()
		})
			.pipe(gulpTslint({
				program: tslint.Linter.createProgram('test/fixtures/tslint/tslint.json')
			}))
			.pipe(reporter({
				filter: null
			}))

			.on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/tslint/invalid.ts');
				assert.ok(/\s+\[\d+:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('missing whitespace (TSLint one-line https://palantir.github.io/tslint/rules/one-line/)') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('missing whitespace (TSLint whitespace https://palantir.github.io/tslint/rules/whitespace/)') >= 0);
				done();
			});
	});
	it('fail function', done => {
		let error;
		return vfs.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd()
		})
			.pipe(gulpTslint({
				program: tslint.Linter.createProgram('test/fixtures/tslint/tslint.json')
			}))
			.pipe(reporter({
				filter: null,
				fail: () => {
					return false;
				}
			}))

			.on('error', ex => {
				error = error || ex;
			}).on('finish', () => {
				assert.ok(!error);
				done();
			});
	});
});
