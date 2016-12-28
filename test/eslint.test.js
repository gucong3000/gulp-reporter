const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gulp = require('gulp');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const reporter = require('../');

require('./sandbox');

describe('eslint', function() {
	it('console reporter', function(done) {
		return gulp.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				map: function(error) {
					return error.inspect();
				}
			})).on('error', function(ex) {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
			}).on('finish', function() {
				// console.log(gutil.log.lastCall.args[0]);
				assert.ok(/^test\/fixtures\/eslint\/invalid\.js\n/.test(gutil.log.lastCall.args[0]));
				assert.ok(/\s+ESLint\:\s+'a' is not defined\.\s*\(ESLint no-undef\)\n/.test(gutil.log.lastCall.args[0]));
				done();
			});
	});

	it('browser reporter', function(done) {
		return gulp.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				browser: true
			})).on('data', function(file) {
				var contents = file.contents.toString();
				assert.ok(/\bSyntaxError\b/.test(contents));
				done();
			});
	});
});
