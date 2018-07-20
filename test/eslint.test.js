'use strict';
const ESLintError = require('../lib/eslint-error');
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
		assert.strictEqual(error.doc, 'https://eslint.org/docs/rules/indent');
	});

	it('ESLintError, zh_CN', () => {
		const ESLintError = proxyquire('../lib/eslint-error', {
			'./locale': 'zh_CN',
		});
		const error = new ESLintError({
			ruleId: 'indent',
		});
		assert.strictEqual(error.doc, 'https://cn.eslint.org/docs/rules/indent');
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
				assert.strictEqual(ex.plugin, 'gulp-reporter');
				assert.strictEqual(ex.message, 'Lint failed for: test/fixtures/eslint/invalid.js');
				const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
				assert.strictEqual(result[0], 'test/fixtures/eslint/invalid.js');
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
				assert.strictEqual(reports.length, 0);
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
				try {
					assert.strictEqual(ex.plugin, 'gulp-reporter');
					done();
				} catch (ex) {
					done(ex);
				}
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
					assert.strictEqual(file.report.errors.length, 0);
				} else {
					assert.ok(file.report.errors.length);
				}
			})
			.on('error', ex => {
				try {
					assert.strictEqual(ex.plugin, 'gulp-reporter');
					assert.ok(files.length >= 2);
					done();
				} catch (ex) {
					done(ex);
				}
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

	it('not commit file', () => {
		const message = [];
		const srcStream = eslint({
			fix: true,
		});
		const stream = srcStream.pipe(reporter({
			fail: false,
			output: msg => {
				message.push(stripAnsi(msg));
			},
		}));

		process.nextTick(() => {
			srcStream.end(new Vinyl({
				base: process.cwd(),
				path: __filename,
				contents: Buffer.from('"use strict";\nalert(console > 1);'),
			}));
		});
		return sandbox.thenable(stream).then(() => {
			assert.ok(/^\s*0+…?\s+\(Not Committed Yet\s+<not.committed.yet>\s+\d+-\d+-\d+ \d+:\d+:\d+\)$/m.test(message[0]));
		});
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
				assert.strictEqual(errors[errors.length - 1].severity, 'warn');
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
				assert.strictEqual(file.report.errors[0].inspect(), [
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
						if (/^(.+?)\/(.+)$/.test(error.rule)) {
							if (RegExp.$1 === 'compat') {
								assert.ok(error.doc.startsWith('https://www.caniuse.com/#search='));
								assert.ok(/search=[a-z]+$/.test(error.doc));
							} else if (RegExp.$1 === 'standard') {
								assert.strictEqual(error.doc, 'https://www.npmjs.com/package/eslint-plugin-standard#rules-explanations');
							} else {
								const pluginName = RegExp.$1;
								const ruleName = RegExp.$2;
								assert.ok(/^https?:\/\/github.com\/\w+\/eslint-plugin-(\w+)\/blob\/HEAD\/docs\/rules\/(.+?)\.md#readme$/.test(error.doc));
								assert.strictEqual(pluginName, RegExp.$1);
								assert.strictEqual(ruleName, RegExp.$2);
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

	it('jsdoc/check-param-names', () => {
		const error = new ESLintError({
			'ruleId': 'jsdoc/check-param-names',
		});
		assert.strictEqual(error.doc, 'https://www.npmjs.com/package/eslint-plugin-jsdoc#check-param-names');
	});

	it('gettext/no-variable-string', () => {
		const error = new ESLintError({
			'ruleId': 'gettext/no-variable-string',
		});
		assert.strictEqual(error.doc, 'https://www.npmjs.com/package/eslint-plugin-gettext#gettextno-variable-string');
	});

	it('alint/bracket-predicates', () => {
		const error = new ESLintError({
			'ruleId': 'alint/bracket-predicates',
		});
		assert.strictEqual(error.doc, 'https://www.npmjs.com/package/eslint-plugin-alint#bracket-predicates');
	});

	it('sql/format', () => {
		const error = new ESLintError({
			'ruleId': 'sql/format',
		});
		assert.strictEqual(error.doc, 'https://www.npmjs.com/package/eslint-plugin-sql#eslint-plugin-sql-rules-format');
	});

	it('not/exist', () => {
		const error = new ESLintError({
			'ruleId': 'not/exist',
		});
		assert.ifError(error.doc);
	});
});
