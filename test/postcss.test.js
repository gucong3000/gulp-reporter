'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const reporter = require('../');
const postcss = require('gulp-html-postcss');
const stylelint = require('stylelint');
const sandbox = require('./sandbox');

describe('PostCSS', function() {

	it('not fail when valid', done => {
		return vfs.src('test/fixtures/postcss/valid.css', {
			base: process.cwd()
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				author: null
			}))
			.on('error', done)
			.on('finish', done);
	});

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
			.on('error', done)
			.on('finish', () => {
				const log = sandbox.getLog();
				assert.ok(/\s+\[\d+:\d+\]/.test(log));
				assert.ok(log.indexOf('Unexpected empty block (stylelint block-no-empty http') >= 0);
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
				const reMessage = /^\[\d+:\d+\]\s+.+?\s+\(\w+\s+\w+(-\w+)*\s+https?:\/\/(goo\.gl|t\.cn)\/\w+\)$/;
				const reBlame = /^\w+…?\s\(\S+.*?\s+<.+?>\s+\d+.+?\)$/;
				const reSource = /^\d+|\s*.*?\S$/;

				assert.equal(ex.message, 'Lint failed for: test/fixtures/postcss/invalid.css');
				const log = sandbox.getLog().split(/\s*\r?\n\s*/g);
				assert.equal(log[0], 'test/fixtures/postcss/invalid.css');
				assert.ok(reMessage.test(log[1]));
				assert.ok(reMessage.test(log[4]));

				assert.ok(reSource.test(log[2]));
				assert.ok(reSource.test(log[5]));

				assert.ok(reBlame.test(log[3]));
				assert.ok(reBlame.test(log[6]));

				done();
			});
	});

	it('browser reporter', done => {
		return vfs.src('test/fixtures/postcss/invalid.css', {
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
				assert.ok(/\W+test\W+fixtures\W+postcss\W+invalid\.css\b/i.test(contents));
				assert.ok(/\[\d+:\d+\]/.test(contents));
				assert.ok(/\bUnexpected vendor-prefix/.test(contents));
				done();
			});

	});
});
