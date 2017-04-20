'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const htmlhint = require('gulp-htmlhint');
const reporter = require('../');

// require('./sandbox');

describe('HTMLHint', function() {
	it('console reporter', function(done) {
		return vfs.src('test/fixtures/htmlhint/invalid.html', {
			base: process.cwd()
		})
			.pipe(htmlhint())
			.pipe(reporter({
				filter: null
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				// assert.equal(ex.message, 'Lint failed for: test/fixtures/htmlhint/invalid.html');
				// assert.ok(/^test\/fixtures\/htmlhint\/invalid.html\n/.test(gutil.log.lastCall.args[0]));
				// assert.ok(gutil.log.lastCall.args[0].indexOf('(HTMLHint tag-pair https://github.com/yaniswang/HTMLHint/wiki/tag-pair)') >= 0);
				done();
			});
	});
});
