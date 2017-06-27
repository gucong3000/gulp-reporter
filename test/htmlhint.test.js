'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const gutil = require('gulp-util');
const vfs = require('vinyl-fs');
const htmlhint = require('gulp-htmlhint');
const reporter = require('../');
const before = require('mocha').before;
const after = require('mocha').after;

require('./sandbox');

describe('HTMLHint', () => {
	require('../lib/locale');
	const localeModule = require.cache[require.resolve('../lib/locale')];

	before(() => {
		localeModule.exports = 'zh_CN';
		delete require.cache[require.resolve('../lib/lint-error')];
	});

	after(() => {
		localeModule.exports = 'en_US';
	});

	it('console reporter', (done) => {
		return vfs.src('test/fixtures/htmlhint/invalid.html', {
			base: process.cwd()
		})
			.pipe(htmlhint())
			.pipe(reporter({
				author: null
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/htmlhint/invalid.html');
				assert.ok(/^test\/fixtures\/htmlhint\/invalid.html\n/.test(gutil.log.lastCall.args[0]));
				assert.ok(gutil.log.lastCall.args[0].indexOf('(HTMLHint doctype-first https://goo.gl/jcpmfT)') >= 0);
				assert.ok(gutil.log.lastCall.args[0].indexOf('(HTMLHint tag-pair https://goo.gl/wFHTJ5)') >= 0);
				if (+process.version.replace(/^v?(\d+).+?$/, '$1') >= 5) {
					assert.ok(gutil.log.lastCall.args[0].indexOf('doctype必须首先声明。') >= 0);
					assert.ok(gutil.log.lastCall.args[0].indexOf('标签必须匹配，缺失') >= 0);
				}
				done();
			});
	});
});
