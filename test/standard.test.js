'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('standard', () => {
	let standard;
	before(() => {
		standard = require('gulp-standard');
	});
	it('console reporter', () => {
		const stream = vfs.src('invalid.js', {
			cwd: 'test/fixtures/standard/',
		})
			.pipe(standard())
			.pipe(reporter({
				output: true,
				blame: false,
			}));
		return sandbox.gotError(stream).then(error => {
			assert.equal(error.plugin, 'gulp-reporter');
			assert.equal(error.message, 'Lint failed for: invalid.js');
			const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
			assert.equal(result[0], 'invalid.js');
		});
	});
});
