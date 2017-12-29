'use strict';
const proxyquire = require('proxyquire');
const stripAnsi = require('strip-ansi');
const eslint = require('gulp-eslint');
const assert = require('assert');
const vfs = require('vinyl-fs');
const Vinyl = require('vinyl');
const path = require('path');
const sandbox = require('./sandbox');
const reporter = require('../');

const { Script } = require('vm');
const {
	JSDOM,
	VirtualConsole,
} = require('jsdom');

describe('ESLint', () => {
	it('ESLintError, en_US', () => {
		const ESLintError = proxyquire('../lib/eslint-error', {
			'./locale': 'en_US',
		});
		const error = new ESLintError({
			ruleId: 'indent',
		});
		assert.equal(error.doc, 'https://eslint.org/docs/rules/indent');
	});

	it('ESLintError, zh_CN', () => {
		const ESLintError = proxyquire('../lib/eslint-error', {
			'./locale': 'zh_CN',
		});
		const error = new ESLintError({
			ruleId: 'indent',
		});
		assert.equal(error.doc, 'https://cn.eslint.org/docs/rules/indent');
	});

	it('console reporter', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				output: true,
				blame: false,
			}))
			.on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/eslint/invalid.js');
				done();
			});
	});

	it('ignore *.min.js', done => {
		const reports = [];
		return vfs.src('test/fixtures/eslint/invalid.min.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				output: {
					write: (report) => {
						reports.push(report);
					},
				},
				author: null,
			}))
			.on('error', done)
			.on('data', file => {
				assert.ifError(file.report.fail);
				assert.ifError(reports.length);
				done();
			});
	});

	it('sort errors', done => {
		return vfs.src('test/fixtures/eslint/sort.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				author: null,
			}))
			.on('data', file => {
				assert.ok(file.report.errors);
				const error = file.report.errors[0].stack;
				assert.ok(/\n\s+at\s+.+?sort\.js:1:1$/m.test(error));
				assert.ok(/\n\s+at\s+https?:\/\/(?:\w+\.)?eslint.org\/docs\/rules\/strict$/m.test(error));
			})
			.on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				done();
			});
	});

	it('multi file', done => {
		const files = [];
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
			}))
			.on('data', file => {
				files.push(file);
				if (/\.min\.\w+/.test(file.path)) {
					assert.ifError(file.report.errors.length);
				} else {
					assert.ok(file.report.errors.length);
				}
			})
			.on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.ok(files.length >= 2);
				done();
			});
	});

	it('not fail & console', done => {
		return vfs.src('test/fixtures/eslint/*.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				fail: false,
			}))
			.on('finish', done)
			.on('error', done);
	});

	it('not commit file', done => {
		const message = [];
		const stream = eslint({
			fix: true,
		});
		stream.pipe(reporter({
			fail: false,
			output: msg => {
				message.push(stripAnsi(msg));
			},
		}))
			.on('finish', () => {
				assert.ok(/^\s*0+…?\s+\(Not Committed Yet\s+<not.committed.yet>\s+\d+-\d+-\d+ \d+:\d+:\d+\)$/m.test(message[0]));
				done();
			})
			.on('error', done);

		stream.write(new Vinyl({
			base: process.cwd(),
			path: __filename,
			contents: Buffer.from('"use strict";\nalert(console > 1);'),
		}));
		stream.end();
	});

	it('warn', done => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint({
				rules: {
					'strict': 'warn',
				},
			}))
			.pipe(reporter({
				author: null,
			}))
			.on('data', file => {
				const errors = file.report.errors;
				assert.equal(errors[errors.length - 1].severity, 'warn');
			})
			.on('error', () => {
				done();
			});
	});

	it('browser reporter', (done) => {
		return vfs.src('test/fixtures/eslint/invalid.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				browser: true,
				output: false,
				blame: false,
				fail: false,
			}))
			.on('data', file => {
				const virtualConsole = new VirtualConsole();
				const dom = new JSDOM('', {
					runScripts: 'dangerously',
					virtualConsole: virtualConsole,
				});
				const script = new Script(file.contents.toString(), {
					filename: file.path,
				});
				virtualConsole.once('error', () => {
					process.nextTick(done);
				});
				dom.runVMScript(script);
			})
			.on('error', done);
	});

	it('Syntax error', done => {
		const message = [];
		return vfs.src('test/fixtures/eslint/SyntaxError.js', {
			base: process.cwd(),
		})
			.pipe(eslint())
			.pipe(reporter({
				output: msg => {
					message.push(msg);
				},
			}))
			.on('data', file => {
				assert.equal(file.report.errors[0].inspect(), [
					'ESLintError: Parsing error: Unexpected token (ESLint)',
					'    at ' + path.resolve('test/fixtures/eslint/SyntaxError.js') + ':2:1',
				].join('\n'));
			})
			.on('error', () => {
				assert.ok(/\bParsing error:/.test(message[0]));
				done();
			});
	});
	it('eslint-config-standard', done => {
		return vfs.src('test/fixtures/eslint/standard.js', {
			base: process.cwd(),
		})
			.pipe(eslint({
				configFile: path.resolve('test/fixtures/eslint/standard.json'),
			}))
			.pipe(reporter({
				fail: false,
				output: false,
				blame: false,
			}))
			.on('data', file => {
				try {
					file.report.errors.forEach(error => {
						if (/^(.+?)\//.test(error.rule)) {
							if (RegExp.$1 === 'compat') {
								assert.ok(error.doc.startsWith('https://www.caniuse.com/#search='));
								assert.ok(/search=[a-z]+$/.test(error.doc));
							} else {
								const packageName = 'eslint-plugin-' + RegExp.$1;
								assert.ok(error.doc.indexOf(packageName) > 1);
							}
							assert.ok(error.doc.startsWith('https://'));
						}
					});
				} catch (ex) {
					done(ex);
					return;
				}
				done();
			});
	});
});
