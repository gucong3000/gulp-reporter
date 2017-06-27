'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const reporter = require('../');
const postcss = require('gulp-postcss');

require('./sandbox');

describe('PostCSS', function() {
	this.timeout(10000);
	it('console reporter', done => {
		return vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss([
				require('stylelint'),
			]))
			.pipe(reporter({
				author: null
			}))
			.on('error', ex => {
				assert.equal(ex.message, 'Lint failed for: test/fixtures/postcss/empty-block-with-disables.css');
			}).on('finish', () => {
				assert.ok(/\s+\[\d+:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('Unexpected empty block (stylelint block-no-empty http') >= 0);
				done();
			});

	});

	it('browser reporter', done => {
		this.timeout(10000);
		return vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss([
				require('stylelint'),
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
