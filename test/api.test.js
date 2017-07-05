'use strict';
const assert = require('assert');
const shortDocUrl = require('../lib/short-doc-url');
const sortErrors = require('../lib/sort-errors');
const gitAuthor = require('../lib/git-author');
const vfs = require('vinyl-fs');
const eslint = require('gulp-eslint');
const reporter = require('../');
const gutil = require('gulp-util');
const through = require('through2');
// const sandbox = require('./sandbox');

require('./sandbox');

describe('API', () => {

	it('short-doc-url', () => {
		return shortDocUrl([{
			doc: 'http://163.com'
		}]).then(errors => {
			if (errors[0].docShort) {
				assert.ok(/^https?:\/\/(goo\.gl|t\.cn)\//.test(errors[0].docShort));
			}
		});
	});

	it('short-doc-url error', () => {
		return shortDocUrl([{
			doc: '$#@&*!'
		}]).then(errors => {
			assert.ifError(errors[0].docShort);
		});
	});

	it('sort-errors', () => {
		const result = sortErrors([
			{
				severity: '!',
			},
			{
				severity: 'info',
			},
			{
			},
			{
				severity: 'warn',
			},
			{
				severity: 'error',
			}
		]);

		assert.ifError(result[0].severity);
		assert.equal(result[1].severity, 'error');
		assert.equal(result[2].severity, 'warn');
		assert.equal(result[3].severity, 'info');
		assert.equal(result[4].severity, '!');
	});

	describe('git-author', () => {
		before(() => {
			process.env.GIT_AUTHOR_DATE = '@1498558291 +0800';
			process.env.GIT_AUTHOR_NAME = 'name.test';
			process.env.GIT_AUTHOR_EMAIL = 'test@test.com';
		});

		after(() => {
			delete process.env.GIT_AUTHOR_DATE;
			delete process.env.GIT_AUTHOR_NAME;
			delete process.env.GIT_AUTHOR_EMAIL;
		});
		it('getEvnAuthor()', () => {
			assert.deepEqual(gitAuthor(), {
				time: 1498558291,
				name: 'name.test',
				email: 'test@test.com'
			});
		});
	});

	it('git-author error', () => {
		return gitAuthor('/').then(result => {
			assert.ifError(result);
		});
	});

	it('file not in git repo', done => {
		const stream = reporter();

		stream.on('data', (file) => {
			assert.ok(file.report);
			assert.ifError(file.report.fail);
			done();
		});

		stream.write(new gutil.File({
			cwd: '/',
			path: '/testcase.js',
			contents: new Buffer('heheh')
		}));

		return stream;
	});

	it('file not in git repo with error', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd()
		})
			.pipe(eslint())
			.pipe(through.obj((file, encoding, done) => {
				file.path = '/invalid.js';
				file.cwd = '/';
				done(null, file);
			}))
			.pipe(reporter({
				author: null,
				sort: false,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				done();
			});
	});

	describe('git-author', () => {
		before(() => {
			process.env.GIT_AUTHOR_DATE = '@1498558291 +0800';
			process.env.GIT_AUTHOR_NAME = 'name.test';
			process.env.GIT_AUTHOR_EMAIL = 'test@test.com';
		});

		after(() => {
			delete process.env.GIT_AUTHOR_DATE;
			delete process.env.GIT_AUTHOR_NAME;
			delete process.env.GIT_AUTHOR_EMAIL;
		});
		it('getEvnAuthor()', () => {
			assert.deepEqual(gitAuthor(), {
				time: 1498558291,
				name: 'name.test',
				email: 'test@test.com'
			});
		});
	});

	it('`options` as callback', () => {
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter(() => {
			return {
				fail: false,
			};
		}));
	});

	it('`options.author` as string (name)', () => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter(() => {
			return {
				author: 'not exist',
			};
		}));
	});

	it('`options.author` as string (email)', () => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: 'noexist@mail.com',
		}));
	});

	it('`options.expires` as textual time periods', () => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: null,
			expires: '1d',
		}));
	});

	it('`options.expires` as ISO 8601 Extended Format', () => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: null,
			expires: '2018-01-01T00:00:00.000Z',
		}));
	});

	it('`options.expires` as number', done => {
		vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: null,
			expires: Infinity,
		})).on('error', ex => {
			assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
			done();
		}).resume();
	});

	it('`options.expires` TypeError', done => {
		vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: null,
			expires: true,
		})).on('error', ex => {
			assert.equal(ex.message, '`options.expires` must be `Number`, `Date` or `string`.');
			done();
		}).resume();
	});

	it('`options.expires` as number TypeError', done => {
		vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: null,
			expires: -Infinity,
		})).on('error', ex => {
			assert.equal(ex.message, '`options.expires` must be greater than 0.');
			done();
		}).resume();
	});

	it('`options.expires` as invalid string TypeError', done => {
		vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: null,
			expires: 'error',
		})).on('error', ex => {
			assert.equal(ex.message, '`options.expires` must be valid `Date`.');
			done();
		}).resume();
	});

	it('`options.author.email` as RegExp match nothing', () => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: {
				email: /^not_exist@mail.com$/
			},
		}));
	});

	it('`options.author.email` as RegExp match anything', done => {
		vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: {
				email: /.+/
			},
		})).on('error', ex => {
			assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
			done();
		}).resume();
	});

	it('`options.author.name` as RegExp match nothing', () => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: {
				name: /^not_exist$/
			},
		}));
	});


	it('`options.author.name` as RegExp match anything', done => {
		vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		}).pipe(eslint()).pipe(reporter({
			author: {
				name: /.+/
			},
		})).on('error', ex => {
			assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
			done();
		}).resume();
	});

});
