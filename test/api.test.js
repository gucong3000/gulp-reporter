'use strict';
const assert = require('assert');
const addPostcssSource = require('../lib/add-postcss-source');
const browserReporter = require('../lib/browser-reporter');
const shortDocUrl = require('../lib/short-doc-url');
const demoteErrors = require('../lib/demote-errors');
const sortErrors = require('../lib/sort-errors');
const getOptions = require('../lib/get-options');
const gitAuthor = require('../lib/git-author');
const formatter = require('../lib/formatter');
const reporter = require('../');
const proxyquire = require('proxyquire');
const stripAnsi = require('strip-ansi');
const eslint = require('gulp-eslint');
const through = require('through2');
const inGFW = require('in-gfw');
const vfs = require('vinyl-fs');
const Vinyl = require('vinyl');
const path = require('path');

require('./sandbox');

describe('API', () => {
	it('short-doc-url (in GFW)', () => {
		const shortDocUrl = proxyquire('../lib/short-doc-url', {
			'./locale': 'zh_CN',
			'in-gfw': () => Promise.resolve(true),
		});
		return shortDocUrl([{
			doc: 'http://163.com',
		}]).then(errors => {
			if (!errors[0].docShort) {
				return;
			}
			assert.ok(/^https?:\/\/t\.cn\//.test(errors[0].docShort));
		});
	});

	if (!inGFW.sync()) {
		it('short-doc-url (out GFW)', () => {
			const shortDocUrl = proxyquire('../lib/short-doc-url', {
				'./locale': 'en_US',
				'in-gfw': () => Promise.resolve(false),
			});
			return shortDocUrl([{
				doc: 'http://163.com',
			}]).then(errors => {
				if (!errors[0].docShort) {
					return;
				}
				assert.ok(/^https?:\/\/goo\.gl\//.test(errors[0].docShort));
			});
		});
	}

	it('short-doc-url error', () => {
		return shortDocUrl([{
			doc: '$#@&*!',
		}]).then(errors => {
			assert.ifError(errors[0].docShort);
		});
	});

	it('short-doc-url (CI in GFW)', () => {
		const shortDocUrl = proxyquire('../lib/short-doc-url', {
			'./locale': 'zh_CN',
			'ci-info': {
				isCI: true,
				name: 'Jenkins',
			},
		});
		return shortDocUrl([{
			doc: 'https://stylelint.io/user-guide/rules/indentation/',
		}]).then(errors => {
			assert.strictEqual(errors[0].docShort, 'https://t.cn/Ro8Mjw5');
		});
	});

	it('short-doc-url (CI out GFW)', () => {
		const shortDocUrl = proxyquire('../lib/short-doc-url', {
			'./locale': 'en_US',
			'ci-info': {
				isCI: true,
				name: 'Jenkins',
			},
		});
		return shortDocUrl([{
			doc: 'https://stylelint.io/user-guide/rules/indentation/',
		}]).then(errors => {
			assert.strictEqual(errors[0].docShort, 'https://goo.gl/NVQ9aa');
		});
	});

	it('short-doc-url (local in GFW)', () => {
		const shortDocUrl = proxyquire('../lib/short-doc-url', {
			'ci-info': {
				isCI: false,
			},
			'in-gfw': () => Promise.resolve(true),
		});
		return shortDocUrl([{
			doc: 'https://stylelint.io/user-guide/rules/indentation/',
		}]).then(errors => {
			assert.strictEqual(errors[0].docShort, 'https://t.cn/Ro8Mjw5');
		});
	});

	it('short-doc-url (local out GFW)', () => {
		const shortDocUrl = proxyquire('../lib/short-doc-url', {
			'ci-info': {
				isCI: false,
			},
			'in-gfw': () => Promise.resolve(false),
		});
		return shortDocUrl([{
			doc: 'https://stylelint.io/user-guide/rules/indentation/',
		}]).then(errors => {
			assert.strictEqual(errors[0].docShort, 'https://goo.gl/NVQ9aa');
		});
	});

	describe('demote-errors', () => {
		it('bad options', () => {
			demoteErrors([{}], {
				author: true,
			});
		});
	});

	describe('sort-errors', () => {
		it('sort by severity', () => {
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
				},
			]);

			assert.ifError(result[0].severity);
			assert.strictEqual(result[1].severity, 'error');
			assert.strictEqual(result[2].severity, 'warn');
			assert.strictEqual(result[3].severity, 'info');
			assert.strictEqual(result[4].severity, '!');
		});

		it('sort by fileName', () => {
			const result = sortErrors([
				{
					fileName: 'ccc',
				},
				{
					fileName: 'aaa',
				},
				{
				},
				{
					fileName: 'bbb',
				},
				{
					fileName: '!',
				},
			]);

			assert.ifError(result[0].fileName);
			assert.strictEqual(result[1].fileName, '!');
			assert.strictEqual(result[2].fileName, 'aaa');
			assert.strictEqual(result[3].fileName, 'bbb');
			assert.strictEqual(result[4].fileName, 'ccc');
		});

		it('sort by demote', () => {
			const result = sortErrors([
				{
				},
				{
					demote: true,
				},
				{
				},
				{
					demote: true,
				},
			]);
			assert.ifError(result[0].demote);
			assert.ifError(result[1].demote);
			assert.ok(result[2].demote);
			assert.ok(result[3].demote);
		});

		it('sort by pos', () => {
			const result = sortErrors([
				{
					columnNumber: 3,
					lineNumber: 8,
				},
				{
				},
				{
					columnNumber: 2,
				},
				{
					columnNumber: 3,
					lineNumber: 4,
				},
				{
					columnNumber: 6,
					lineNumber: 4,
				},
				{
					columnNumber: 6,
					lineNumber: 8,
				},
			]);

			assert.ifError(result[0].lineNumber);
			assert.ifError(result[0].columnNumber);
			assert.ifError(result[1].lineNumber);
			assert.strictEqual(result[1].columnNumber, 2);
			assert.strictEqual(result[2].lineNumber, 4);
			assert.strictEqual(result[2].columnNumber, 3);
			assert.strictEqual(result[3].lineNumber, 4);
			assert.strictEqual(result[3].columnNumber, 6);
			assert.strictEqual(result[4].lineNumber, 8);
			assert.strictEqual(result[4].columnNumber, 3);
			assert.strictEqual(result[5].lineNumber, 8);
			assert.strictEqual(result[5].columnNumber, 6);
		});
	});

	describe('add-postcss-source', () => {
		it('get source fail', () => {
			const errors = ['testcase'];
			assert.strictEqual(addPostcssSource({}, errors), errors);
		});
		it('get error line fail', () => {
			const errors = ['testcase'];
			assert.deepStrictEqual(addPostcssSource({
				postcss: {
					root: {
						source: {
							input: {
								css: 'a{}',
							},
						},
					},
				},
			}, errors), errors);
		});
	});

	describe('git precommit env', () => {
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
			assert.deepStrictEqual(gitAuthor(), {
				time: 1498558291,
				name: 'name.test',
				email: 'test@test.com',
			});
		});

		it('getEvnAuthor() fail', () => {
			delete process.env.GIT_AUTHOR_NAME;
			assert.notDeepStrictEqual(gitAuthor(), {
				time: 1498558291,
				name: 'name.test',
				email: 'test@test.com',
			});
		});

		it('file not in git repo with error', done => {
			return vfs.src('test/fixtures/eslint/invalid.js', {
				base: process.cwd(),
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
				}))
				.on('error', ex => {
					assert.strictEqual(ex.plugin, 'gulp-reporter');
					done();
				});
		});
	});

	describe('error formatter', () => {
		function splitLog (log) {
			/* eslint-disable-next-line no-control-regex */
			return stripAnsi(log.replace(/\u001b]50;\w+=.+?\u0007/g, '').replace(/([\u2000-\u3000])\ufe0f?\s+/g, '$1\u{fe0f} ')).split('\n');
		}
		it('break line', () => {
			const fileName = path.join(__dirname, 'fixtures/testcase');

			assert.deepStrictEqual(splitLog(formatter({
				cwd: __dirname,
				path: fileName,
				report: {
					errors: [{
						plugin: 'testLinter',
						rule: 'testRule',
						doc: 'http://testLinter.com/testRule',
						message: 'testcase message.',
						source: 'testcase source',
						fileName,
					}],
				},
			}, {
				blame: true,
				_termColumns: 60,
			})), [
				'fixtures/testcase',
				'    01:01 \u{2714}\u{FE0F} testcase message.',
				'      (testLinter testRule http://testLinter.com/testRule)',
				'       01 | testcase source',
			]);
		});
		it('simple', () => {
			const fileName = path.join(__dirname, 'fixtures/testcase');

			assert.deepStrictEqual(splitLog(formatter({
				cwd: __dirname,
				path: fileName,
				report: {
					errors: [{
						message: 'testcase message.',
						source: 'testcase source',
						fileName,
					}],
				},
			}, {
				blame: false,
				_termColumns: 60,
			})), [
				'fixtures/testcase',
				'    01:01 \u{2714}\u{FE0F} testcase message.',
			]);
		});

		describe('mock Windows', () => {
			const fileName = path.join(__dirname, 'fixtures/testcase');
			const VSCODE_PID = process.env.VSCODE_PID;
			const ConEmuPID = process.env.ConEmuPID;
			const isTTY = process.stdout.isTTY;
			before(() => {
				process.stdout.isTTY = true;
			});
			after(() => {
				if (VSCODE_PID) {
					process.env.VSCODE_PID = VSCODE_PID;
				} else {
					delete process.env.VSCODE_PID;
				}
				if (ConEmuPID) {
					process.env.ConEmuPID = ConEmuPID;
				} else {
					delete process.env.ConEmuPID;
				}
				if (isTTY) {
					process.stdout.isTTY = isTTY;
				} else {
					delete process.stdout.isTTY;
				}
			});
			function splitLog (log) {
				/* eslint-disable-next-line no-control-regex */
				return stripAnsi(log.replace(/\u001b]50;\w+=.+?\u0007/g, '')).split('\n');
			}
			function formatter (env, error) {
				delete process.env.VSCODE_PID;
				delete process.env.ConEmuPID;
				Object.assign(process.env, env);
				const formatter = proxyquire('../lib/formatter', {
					'ci-info': {
						isCI: false,
					},
					'is-windows': () => true,
				});
				return splitLog(formatter({
					cwd: __dirname,
					path: fileName,
					report: {
						errors: [Object.assign({}, {
							message: 'testcase message.',
							source: 'testcase source',
							fileName,
						}, error)],
					},
				}, {
					blame: false,
					_termColumns: 60,
				}));
			}

			it('vscode', () => {
				assert.deepStrictEqual(formatter({
					VSCODE_PID: 'mock_pid',
				}), [
					'fixtures/testcase',
					'    01:01 \u{2714}\u{FE0F}  testcase message.',
				]);
				assert.deepStrictEqual(formatter({
					VSCODE_PID: 'mock_pid',
				}, {
					severity: 'error',
				}), [
					'fixtures/testcase',
					'    01:01 \u{274C}  testcase message.',
				]);
				assert.deepStrictEqual(formatter({
					VSCODE_PID: 'mock_pid',
				}, {
					severity: 'info',
				}), [
					'fixtures/testcase',
					'    01:01 \u{2139}\u{FE0F} testcase message.',
				]);
			});

			it('ConEmu', () => {
				assert.deepStrictEqual(formatter({
					ConEmuPID: 'mock_pid',
				}, {
				}), [
					'fixtures/testcase',
					'    01:01 \u{2714}\u{FE0F} testcase message.',
				]);
				assert.deepStrictEqual(formatter({
					ConEmuPID: 'mock_pid',
				}, {
					severity: 'error',
				}), [
					'fixtures/testcase',
					'    01:01 \u{274C}\u{FE0F} testcase message.',
				]);
				assert.deepStrictEqual(formatter({
					ConEmuPID: 'mock_pid',
				}, {
					severity: 'info',
				}), [
					'fixtures/testcase',
					'    01:01 ‼ testcase message.',
				]);
			});
			it('cmd', () => {
				assert.deepStrictEqual(formatter({
				}, {
					severity: 'error',
				}), [
					'fixtures/testcase',
					'    01:01 \u{274C} testcase message.',
				]);
				assert.deepStrictEqual(formatter({
				}, {
					severity: 'info',
				}), [
					'fixtures/testcase',
					'    01:01 \u{2139} testcase message.',
				]);
			});
		});
	});

	describe('browser-reporter', () => {
		it('file is null', () => {
			const file = new Vinyl({
				cwd: '/',
				path: '/testcase.js',
			});
			browserReporter(file, []);
		});
		it('file without error (Buffer)', () => {
			const contents = Buffer.from('testcase_contents');
			const file = new Vinyl({
				cwd: '/',
				path: '/testcase.js',
				contents: contents,
			});
			browserReporter(file, []);
			assert.strictEqual(file.contents.contents);
		});
		it('file without error (streams)', done => {
			const contents = through();
			const file = new Vinyl({
				cwd: '/',
				path: '/testcase.js',
				contents: contents,
			});
			browserReporter(file, []);
			file.contents.on('data', contents => {
				assert.strictEqual(contents.toString(), 'testcase_contents');
				done();
			});
			contents.end(Buffer.from('testcase_contents'));
		});
	});

	describe('getOptions', () => {
		it('get options', () => {
			return getOptions({
				expires: 1000,
			})({
				cwd: '/_/',
			}).then(options => {
				assert.ok(options);
				assert.ok(options._expiresTime > 0);
				assert.ok(options._termColumns > 0);
			});
		});
		it('get options with blame', () => {
			return getOptions({
				blame: false,
			})({
				cwd: __dirname,
			}).then(options => {
				assert.ifError(options._expiresTime);
				assert.strictEqual(options.author, false);
			});
		});
		it('mock', () => {
			const getOptions = proxyquire('../lib/get-options', {
				'ci-info': {
					isCI: !process.env.CI,
				},
			});
			return getOptions({
				blame: false,
			})({
				cwd: __dirname,
			}).then(options => {
				assert.ok(options._termColumns > 0);
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

		stream.on('error', done);

		stream.write(new Vinyl({
			cwd: '/',
			path: '/testcase.js',
			contents: Buffer.from('heheh'),
		}));
	});

	it('`options` as callback', done => {
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter(() => {
				return {
					fail: false,
				};
			}))
			.on('finish', done)
			.on('error', done);
	});

	it('`options.author` as string (name)', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter(() => ({
				author: 'not exist',
			})))
			.on('finish', done)
			.on('error', done);
	});

	it('`options.author` as string (email)', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: 'noexist@mail.com',
			}))
			.on('finish', done)
			.on('error', done);
	});

	it('`options.expires` as textual time periods', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
				expires: '1d',
			}))
			.on('finish', done)
			.on('error', done);
	});

	it('`options.expires` as ISO 8601 Extended Format', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
				expires: '2018-01-01T00:00:00.000Z',
			}))
			.on('finish', done)
			.on('error', done);
	});

	it('`options.expires` as number', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
				expires: Infinity,
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				done();
			});
	});

	it('`options.expires` TypeError', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
				expires: true,
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, '`options.expires` must be `Number`, `Date` or `string`.');
				done();
			});
	});

	it('`options.expires` as number TypeError', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
				expires: -Infinity,
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, '`options.expires` must be greater than 0.');
				done();
			});
	});

	it('`options.expires` as invalid string TypeError', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
				expires: 'error',
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, '`options.expires` must be valid `Date`.');
				done();
			});
	});

	it('`options.author.email` as RegExp match nothing', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: {
					email: /^not_exist@mail.com$/,
				},
			}))
			.on('finish', done);
	});

	it('`options.author.email` as RegExp match anything', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: {
					email: /.+/,
				},
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				done();
			});
	});

	it('`options.author.name` as RegExp match nothing', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: {
					name: /^not_exist$/,
				},
			}))
			.on('finish', done);
	});

	it('`options.author.name` as RegExp match anything', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: {
					name: /.+/,
				},
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				done();
			});
	});

	it('`options.maxLineLength` as null', done => {
		return vfs.src('test/fixtures/eslint/invalid.min.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				blame: false,
				maxLineLength: null,
			}))
			.on('error', ex => {
				assert.strictEqual(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.min.js');
				done();
			});
	});

	it('`options.mapper` as null', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				mapper: () =>
					() => {}
				,
			}))
			.on('error', done)
			.on('data', file => {
				assert.ifError(file.report.fail);
				done();
			});
	});
});
