'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const eclint = require('eclint');
const reporter = require('../');

require('./sandbox');

describe('ECLint', () => {
	it('console reporter', done => {
		return vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			stripBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter({
				filter: null
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

				assert.ok(gutil.log.lastCall.args[0].indexOf('(EditorConfig charset https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#charset)') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('(EditorConfig indent_style https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#indent_style') >= 0);

				done();
			});
	});
});
