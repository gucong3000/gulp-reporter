'use strict';
const csslint = require('gulp-csslint');
const assert = require('assert');
const vfs = require('vinyl-fs');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('CSSLint', function () {
	this.timeout(10000);
	it('console reporter', done => {
		return vfs.src('test/fixtures/csslint/invalid.css', {
			base: process.cwd(),
			removeBOM: false,
		})
			.pipe(csslint({
				'duplicate-properties': 2,
			}))
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/csslint/invalid.css');
				const log = sandbox.getLog();
				assert.ok(log.indexOf('test/fixtures/csslint/invalid.css') >= 0);
				assert.ok(log.indexOf('(CSSLint order-alphabetical') >= 0);
				assert.ok(log.indexOf('(CSSLint duplicate-properties') >= 0);
				done();
			});
	});

	it('browser reporter', done => {
		return vfs.src('test/fixtures/csslint/invalid.css', {
			base: process.cwd(),
			removeBOM: false,
		})
			.pipe(csslint())
			.pipe(reporter({
				browser: true,
				output: false,
				fail: false,
				author: null,
			})).on('data', file => {
				const contents = file.contents.toString();
				assert.ok(/\W+test\W+fixtures\W+csslint\W+invalid\.css\b/i.test(contents));
				assert.ok(/\d+:\d+/.test(contents));
				assert.ok(/\bCSSLint order-alphabetical\b/.test(contents));
				done();
			});
	});
});
