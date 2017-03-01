'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const postcss = require('./fixtures/postcss/gulp-postcss');
const reporter = require('../');

require('./sandbox');

describe('PostCSS', function() {
	it('console reporter', function(done) {
		this.timeout(10000);
		return vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss({
				processors:[
					require('stylelint'),
				]
			}))
			.pipe(reporter({
				filter: null
			}))
			.on('error', function(ex) {
				assert.equal(ex.message, 'Lint failed for: test/fixtures/postcss/empty-block-with-disables.css');
			}).on('finish', function() {
				assert.ok(/\s+\[\d+\:\d+\]/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('Unexpected empty block (stylelint block-no-empty https://stylelint.io/user-guide/rules/block-no-empty/)') >= 0);
				done();
			});

	});

	it('browser reporter', function(done) {
		this.timeout(10000);
		return vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss({
				processors:[
					require('stylelint'),
				]
			}))
			.pipe(reporter({
				browser: true,
				fail: false,
				filter: null,
			})).on('data', function(file) {
				var contents = file.contents.toString();
				assert.ok(/\btest\/fixtures\/postcss\/empty-block-with-disables.css\b/.test(contents));
				assert.ok(/\[\d+\:\d+\]/.test(contents));
				assert.ok(/\bUnexpected empty block \(stylelint block-no-empty\)/.test(contents));
				done();
			});

	});
});
