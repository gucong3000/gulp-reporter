'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const reporter = require('../');
const Vinyl = require('vinyl');
const sandbox = require('./sandbox');

describe('ESLint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				author: 'qil@jumei.com',
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
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
				author: null
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
				author: null
			})).on('data', file => {
				assert.ok(file.report.errors);
				assert.ok(/sort\.js:1:1\)$/.test(file.report.errors[0].inspect()));
			}).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				done();
			});
	});

	it('multi file', done => {
		const files  = [];
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		}).pipe(eslint())
			.pipe(reporter({
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
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			fail: false,
		})).on('finish', done).on('error', done);
	});

	it('not commit file', done => {
		const message = [];
		const stream = eslint({
			fix: true
		});
		stream.pipe(reporter({
			fail: false,
			console: msg => {
				message.push(gutil.colors.stripColor(msg));
			}
		})).on('finish', () => {
			assert.ok(/\s+0+\s+\(Not Committed Yet <not.committed.yet> \d+\D\d+\D\d+.+?\)/.test(message[0]));
			done();
		}).on('error', done);

		stream.write(new Vinyl({
			base: process.cwd(),
			path: __filename,
			contents: new Buffer('"use strict";\nalert(console > 1);')
		}));
		stream.end();
	});

	it('warn', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint({
				rules: {
					'strict': 'warn'
				},
			}))
			.pipe(reporter({
				author: null,
			})).on('data', file => {
				const errors = file.report.errors;
				assert.equal(errors[errors.length - 1].severity, 'warn');
			}).on('error', () => {
				done();
			});
	});

	it('Syntax error', done => {
		const message = [];
		return vfs.src('test/fixtures/eslint/SyntaxError.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(reporter({
				console: msg => {
					message.push(msg);
				}
			})).on('error', () => {
				assert.ok(/\bParsing error:/.test(message[0]));
				done();
			});
	});
});
