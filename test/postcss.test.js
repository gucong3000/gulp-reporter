'use strict';
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const reporter = require('../');
const postcss = require('gulp-postcss');
const stylelint = require('stylelint');

require('./sandbox');

describe('PostCSS', function() {
	it('not fail with only warning', done => {
		return vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				author: null
			}))
			.on('error', done).on('finish', () => {
				assert.ok(/\s+\[\d+:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('Unexpected empty block (stylelint block-no-empty http') >= 0);
				done();
			});
	});

	it('console reporter', done => {
		return vfs.src('test/fixtures/postcss/invalid.css', {
			base: process.cwd()
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				author: null
			}))
			.on('error', ex => {
				assert.equal(ex.message, 'Lint failed for: test/fixtures/postcss/invalid.css');
				assert.ok(/\s+\[\d+:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('Unexpected vendor-prefix "-webkit-appearance" (stylelint property-no-vendor-prefix http') >= 0);
				done();
			});
	});

	it('browser reporter', done => {
		return vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				browser: true,
				fail: false,
				author: null,
			})).on('data', file => {
				const contents = file.contents.toString();
				assert.ok(/\btest\/fixtures\/postcss\/empty-block-with-disables.css\b/.test(contents));
				assert.ok(/\[\d+:\d+\]/.test(contents));
				assert.ok(/\bUnexpected empty block \(stylelint block-no-empty\)/.test(contents));
				done();
			});

	});
});
