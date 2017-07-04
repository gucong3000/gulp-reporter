'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const reporter = require('../');
const postcss = require('gulp-postcss');
const stylelint = require('stylelint');
const sandbox = require('./sandbox');

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
				assert.ok(/\s+\[\d+:\d+\]/.test(sandbox.getLog()));
				assert.ok(sandbox.getLog().indexOf('Unexpected empty block (stylelint block-no-empty http') >= 0);
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
				assert.ok(/\s+\[\d+:\d+\]/.test(sandbox.getLog()));
				assert.ok(sandbox.getLog().indexOf('Unexpected vendor-prefix "-webkit-appearance" (stylelint property-no-vendor-prefix http') >= 0);
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
				assert.ok(/\W+test\W+fixtures\W+postcss\W+empty-block-with-disables\.css\b/i.test(contents));
				assert.ok(/\[\d+:\d+\]/.test(contents));
				assert.ok(/\bUnexpected empty block \(stylelint block-no-empty https:\/\/stylelint.io\/user-guide\/rules\/block-no-empty\/\)/.test(contents));
				done();
			});

	});
});
