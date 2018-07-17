'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const jsonlint = require('gulp-jsonlint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('JSONLint', () => {
	it('console reporter', () => {
		const stream = vfs.src('test/fixtures/jsonlint/fails/*.json', {
			base: process.cwd(),
		})
			.pipe(jsonlint())
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('data', (file) => {
				assert.ok(file.jsonlint);
				assert.strictEqual(file.jsonlint.success, false);
				const log = sandbox.getLog();
				assert.ok(log.startsWith(file.relative.replace(/\\/g, '/')));
				assert.ok(/^\s*\d+:\d+\s+.+\bExpecting\b.+,\s+got/m.test(log));
			});
		return sandbox.gotError(stream).then(error => {
			assert.strictEqual(error.plugin, 'gulp-reporter');
		});
	});
	it('passes json', () => {
		const stream = vfs.src('test/fixtures/jsonlint/passes/*.json', {
			base: process.cwd(),
		})
			.pipe(jsonlint())
			.pipe(reporter({
				output: true,
				blame: false,
			}));

		return sandbox.thenable(stream).then(files => {
			files.forEach(file => {
				assert.ok(file.jsonlint);
				assert.ok(file.jsonlint.success);
			});
		});
	});
});
