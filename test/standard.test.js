'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const standard = require('gulp-standard');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('standard', () => {
	it('console reporter', done => {
		return vfs.src('invalid.js', {
			cwd: 'test/fixtures/standard/'
		})
			.pipe(standard())
			.pipe(reporter({
				output: true,
				blame: false,
			}))
			.on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: invalid.js');
				const result = sandbox.getLog().split(/\s*\r?\n\s*/g);
				assert.equal(result[0], 'invalid.js');
				done();
			});
	});
});
