'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const gulpTslint = require('gulp-tslint');
const tslint = require('tslint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('TSLint', function() {
	this.timeout(10000);
	it('console reporter', done => {
		return vfs.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd(),
		})
			.pipe(gulpTslint({
				program: tslint.Linter.createProgram('test/fixtures/tslint/tslint.json'),
			}))
			.pipe(reporter({
				output: true,
				blame: false,
			}))

			.on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/tslint/invalid.ts');
				const log = sandbox.getLog();
				assert.ok(/\s+\d+:\d+/.test(log));
				assert.ok(log.indexOf('missing whitespace (TSLint one-line http') >= 0);
				assert.ok(log.indexOf('missing whitespace (TSLint whitespace http') >= 0);
				done();
			});
	});
	it('fail function', done => {
		return vfs.src('test/fixtures/tslint/invalid.ts', {
			base: process.cwd(),
		})
			.pipe(gulpTslint({
				program: tslint.Linter.createProgram('test/fixtures/tslint/tslint.json'),
			}))
			.pipe(reporter({
				author: null,
				fail: () => {
					return false;
				},
			}))
			.on('finish', () => {
				done();
			})
			.on('error', done);
	});
});
