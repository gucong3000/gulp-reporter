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
			base: process.cwd()
		})
			.pipe(htmlhint())
			.pipe(reporter({
				output: true,
				blame: false,
			})).on('error', ex => {
				assert.equal(ex.plugin, 'gulp-reporter');
				assert.equal(ex.message, 'Lint failed for: test/fixtures/htmlhint/invalid.html');
				const log = sandbox.getLog();
				assert.ok(/^test\/fixtures\/htmlhint\/invalid.html\n/.test(log));
				if (locale === 'zh_CN') {
					assert.ok(log.indexOf('doctype必须首先声明。 (HTMLHint doctype-first http://t.cn/Ro8MlrW)') >= 0);
					assert.ok(log.indexOf('标签必须匹配，缺失：[ </h1> ]，在第7行匹配开始标签[ <h1> ]失败 (HTMLHint tag-pair http://t.cn/Ro8MlgP)') >= 0);
				} else {
					assert.ok(log.indexOf('Doctype must be declared first. (HTMLHint doctype-first https://goo.gl/jcpmfT)') >= 0);
					assert.ok(log.indexOf('Tag must be paired, missing: [ </h1> ], start tag match failed [ <h1> ] on line 7. (HTMLHint tag-pair https://goo.gl/wFHTJ5)') >= 0);
				}
				done();
			});
	});
});
