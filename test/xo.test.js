'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('XO', () => {
	let xo;
	before(() => {
		xo = require('gulp-xo');
	});
	it('console reporter', () => {
		const stream = vfs.src('invalid.js', {
			cwd: 'test/fixtures/xo/',
		})
			.pipe(xo())
			.pipe(reporter({
				output: true,
				blame: false,
			}));
		return sandbox.gotError(stream).then(error => {
			assert.strictEqual(error.plugin, 'gulp-reporter');
			assert.strictEqual(error.message, 'Lint failed for: invalid.js');
			const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
			assert.strictEqual(result[0], 'invalid.js');
		});
	});
});
