'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const xo = require('gulp-xo');
const reporter = require('../');
const sandbox = require('./sandbox');

describe('XO', () => {
	it('console reporter', done => {
		return vfs.src('invalid.js', {
			cwd: 'test/fixtures/xo/'
		})
			.pipe(xo())
			.pipe(reporter({
				author: null,
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
