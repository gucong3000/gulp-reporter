'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const jsonlint = require('gulp-jsonlint');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('JSONLint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/jsonlint/fails/*.json', {
			base: process.cwd(),
		})
			.pipe(jsonlint())
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('data', (file) => {
				assert.ok(file.jsonlint);
				assert.ifError(file.jsonlint.success);
				const log = sandbox.getLog();
				assert.ok(log.startsWith(file.relative.replace(/\\/g, '/')));
				assert.ok(/^\s*\d+:\d+\s+.+\bExpecting\b.+,\s+got/m.test(log));
			}).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				done();
			});
	});
	it('passes json', done => {
		return vfs.src('test/fixtures/jsonlint/passes/*.json', {
			base: process.cwd(),
		})
			.pipe(jsonlint())
			.pipe(reporter({
				output: true,
				blame: false,
			}))
			.on('data', (file) => {
				assert.ok(file.jsonlint);
				assert.ok(file.jsonlint.success);
			})
			.on('error', done)
			.on('finish', done);
	});
});
