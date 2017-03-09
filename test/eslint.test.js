'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const vfs = require('vinyl-fs');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const reporter = require('../');

require('./sandbox');

describe('ESLint', function() {
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				filter: [
					reporter.filterByAuthor({
						email: 'qil@jumei.com'
					}),
					reporter.filterByAuthor({
						name: '刘祺'
					}),
					function(error) {
						error.toString = error.inspect;
						return error;
					}
				]
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				var result = gutil.log.lastCall.args[0].split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/eslint/invalid.js');
				done();
			});
	});

	it('ignoreMatcher *.min.js', done => {
		return vfs.src('test/fixtures/eslint/invalid.min.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				filter: null
			})).on('error', done).on('data', file => {
				assert.ok(file.report.ignore);
				done();
			});
	});

	it('sort errors', done => {
		return vfs.src('test/fixtures/eslint/sort.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				filter: null
			})).on('data', file => {
				assert.ok(file.report.errors);
				assert.ok(/sort\.js:1:1\)$/.test(file.report.errors[0].inspect()));
			}).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				done();
			});
	});

	it('multi file', done => {
		let files  = [];
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		}).pipe(eslint())
			.pipe(reporter({
				filter: null
			})).on('data', file => {
				files.push(file);
				assert.ok(file.report.errors || file.report.ignore);
			}).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.ok(files.length >= 2);
				done();
			});
	});

	it('not fail & console', done => {
		let lastMsg;
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			fail: false,
			filter: null,
			console: function(msg) {
				lastMsg = msg;
			}
		})).on('finish', () => {
			assert.ok(/^Lint failed for:/.test(lastMsg));
			done();
		}).on('error', done);
	});

});
