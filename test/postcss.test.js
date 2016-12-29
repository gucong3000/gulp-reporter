const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const gulp = require('gulp');
// const plumber = require('gulp-plumber');
const postcss = require('./fixtures/postcss/gulp-postcss');
const reporter = require('../');

require('./sandbox');

describe('PostCSS', function() {
	it('console reporter', function(done) {
		this.timeout(10000);
		return gulp.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss({
				processors:[
					require('stylelint'),
				]
			}))
			.pipe(reporter({}))
			.on('error', function(ex) {
				assert.equal(ex.message, 'Lint failed for: test/fixtures/postcss/empty-block-with-disables.css');
			}).on('finish', function() {
				var result = gutil.log.lastCall.args[0].split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/postcss/empty-block-with-disables.css');
				assert.equal(result[1], '[2:3] Unexpected empty block (stylelint block-no-empty)');
				done();
			});

	});

	it('browser reporter', function(done) {
		this.timeout(10000);
		return gulp.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd()
		})

			.pipe(postcss({
				processors:[
					require('stylelint'),
				]
			}))
			.pipe(reporter({
				browser: true,
			})).on('data', function(file) {
				var contents = file.contents.toString();
				assert.ok(/\btest\/fixtures\/postcss\/empty-block-with-disables.css\b/.test(contents));
				assert.ok(/\[\d+\:\d+\] Unexpected empty block \(stylelint block-no-empty\)/.test(contents));
				done();
			});

	});
});
