'use strict';
const assert = require('assert');
const vfs = require('vinyl-fs');
const htmlhint = require('gulp-htmlhint');
const reporter = require('../');
const locale = require('../lib/locale');
const sandbox = require('./sandbox');

describe('HTMLHint', () => {
	require('../lib/locale');

	it('console reporter', (done) => {
		return vfs.src('test/fixtures/htmlhint/invalid.html', {
			base: process.cwd(),
		})
			.pipe(htmlhint())
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/htmlhint/invalid.html');
				let log = sandbox.getLog().match(/^.*$/igm);
				try {
					assert.ok(log);
					assert.ok(/^test\/fixtures\/htmlhint\/invalid.html$/.test(log.shift()));
					log = log.map(log => log.match(/^\s*(\d+):(\d+)\s+\S+\s+(.+?)\s+\(HTMLHint\s+(.+?)\s+(https?.+?)\)$/i));
					assert.equal(log[0][1], '01');
					assert.equal(log[0][2], '01');
					assert.equal(log[1][1], '08');
					assert.equal(log[1][2], '01');
					assert.equal(log[0][4], 'doctype-first');
					assert.equal(log[1][4], 'tag-pair');
					if (locale === 'zh_CN') {
						assert.equal(log[0][3], 'doctype必须首先声明。');
						assert.equal(log[1][3], '标签必须匹配，缺失：[ </h1> ]，在第7行匹配开始标签[ <h1> ]失败');
					} else {
						assert.equal(log[0][3], 'Doctype must be declared first.');
						assert.equal(log[1][3], 'Tag must be paired, missing: [ </h1> ], start tag match failed [ <h1> ] on line 7.');
					}
					done();
				} catch (ex) {
					done(ex);
				}
			});
	});
});
