'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const eclint = require('eclint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('ECLint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			removeBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter({
				output: true,
				author: null,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

				const log = sandbox.getLog();
				assert.ok(log.indexOf('(EditorConfig charset http') >= 0);
				assert.ok(log.indexOf('(EditorConfig indent_style http') >= 0);
				assert.ok(/\bdone\(\)/.test(log));
				assert.ok(/@/.test(log));

				done();
			});
	});
	it('console reporter without blame', done => {
		return vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			removeBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', ex => {
				let log;
				try {
					assert.equal(ex.plugin, 'gulp-reporter');
					assert.equal(ex.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

					log = sandbox.getLog();
					assert.ok(log.indexOf('(EditorConfig charset http') >= 0);
					assert.ok(log.indexOf('(EditorConfig indent_style http') >= 0);
					assert.ifError(/\bdone\(\)/.test(log));
					assert.ifError(/@/.test(log));
					done();
				} catch (ex) {
					console.log(log);
					console.error(ex);
					done(ex);
				}
			});
	});
});
