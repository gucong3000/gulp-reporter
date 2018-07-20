'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const stylint = require('gulp-stylint');
const reporter = require('../');
const sandbox = require('./sandbox');
const StyLintError = require('../lib/stylint-error');

describe('stylint', () => {
	it('StyLintError', () => {
		const error = new StyLintError('mock: value');
		assert.strictEqual(error.mock, 'value');
	});

	it('console reporter', () => {
		const stream = vfs.src('test/fixtures/stylint/novalid.styl', {
			base: process.cwd(),
		})
			.pipe(stylint({
				rules: {
					colons: 'never',
					zeroUnits: {
						expect: 'never', error: true,
					},
				},
			}))
			.pipe(reporter({
				output: true,
				blame: false,
			}));

		return sandbox.gotError(stream).then(error => {
			assert.strictEqual(error.plugin, 'gulp-reporter');
			assert.strictEqual(error.message, 'Lint failed for: test/fixtures/stylint/novalid.styl');
			const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
			assert.strictEqual(result[0], 'test/fixtures/stylint/novalid.styl');
			assert.ok(/\d+:\d+/.test(result[1]));
			assert.ok(result[1].endsWith('0 is preferred. Unit value is unnecessary (StyLint)'));
			assert.ok(/\d+:\d+/.test(result[2]));
			assert.ok(result[2].endsWith('unnecessary colon found (StyLint)'));
		});
	});
});
