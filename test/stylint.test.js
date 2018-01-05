'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const stylint = require('gulp-stylint');
const reporter = require('../');
const sandbox = require('./sandbox');
const StyLintError = require('../lib/stylint-error');

describe('stylint', function () {
	it('StyLintError', () => {
		const error = new StyLintError('mock: value');
		assert.equal(error.mock, 'value');
	});

	it('console reporter', done => {
		return vfs.src('test/fixtures/stylint/novalid.styl', {
			base: process.cwd(),
		})
			.pipe(stylint({
				rules: {
					zeroUnits: {
						expect: 'never', error: true,
					},
				},
			}))
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/stylint/novalid.styl');
			}).on('finish', () => {
				const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'test/fixtures/stylint/novalid.styl');
				assert.ok(/\d+:\d+/.test(result[1]));
				assert.ok(result[1].endsWith('0 is preferred. Unit value is unnecessary (StyLint)'));
				done();
			});
	});
});
