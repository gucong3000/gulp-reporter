'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const jscs = require('gulp-jscs');
const reporter = require('../');
const sandbox = require('./sandbox');

const { Script } = require('vm');
const {
	JSDOM,
	VirtualConsole,
} = require('jsdom');

describe('JSCS', function () {
	this.timeout(10000);
	it('console reporter', done => {
		return vfs.src('test/fixtures/jscs/invalid.js', {
			base: process.cwd(),
		})
			.pipe(jscs({
				configPath: 'test/fixtures/jscs/.jscsrc',
			}))
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/jscs/invalid.js');
			}).on('finish', () => {
				const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/jscs/invalid.js');
				assert.ok(/\d+:\d+/.test(result[1]));
				assert.ok(/\bMultiple var declaration \(JSCS disallowMultipleVarDecl http/.test(result[1]));
				done();
			});
	});
	it('browser reporter', done => {
		return vfs.src('test/fixtures/jscs/invalid.js', {
			base: process.cwd(),
		})
			.pipe(jscs({
				configPath: 'test/fixtures/jscs/.jscsrc',
			}))
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
});
