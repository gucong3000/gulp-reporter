'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const vfs = require('vinyl-fs');
const gutil = require('gulp-util');
const eclint = require('eclint');
const reporter = require('../');

require('./sandbox');

describe.skip('ECLint', function() {
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/eclint/invalid.js', {
			base: process.cwd(),
			stripBOM: false,
		})
			.pipe(eclint.check())
			.pipe(reporter()).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/eclint/invalid.js');

				assert.ok(gutil.log.lastCall.args[0].indexOf('invalid charset: utf-8-bom, expected: utf-8 (EditorConfig charset') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#charset)') >= 0);

				assert.ok(gutil.log.lastCall.args[0].indexOf('invalid indentation: found a leading space, expected: tab') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('EditorConfig indent_style https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#indent_style') >= 0);

				done();
			});
	});
});
