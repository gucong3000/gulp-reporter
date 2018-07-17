'use strict';
const proxyquire = require('proxyquire');
const assert = require('assert');
const vfs = require('vinyl-fs');
const reporter = require('../');
const postcss = require('gulp-html-postcss');
const stylelint = require('stylelint');
const sandbox = require('./sandbox');

describe('PostCSS', () => {
	it('PostCSSError', () => {
		const PostCSSError = proxyquire('../lib/postcss-error', {
			'./lint-error': proxyquire('../lib/lint-error', {
				'./locale': 'zh_CN',
			}),
		});
		const error = new PostCSSError({
			input: {
				file: __filename,
			},
			text: 'mock_message',
		});
		assert.strictEqual(error.fileName, __filename);
		assert.strictEqual(error.severity, 'error');
	});

	it('not fail when valid', () => {
		const stream = vfs.src('test/fixtures/postcss/valid.css', {
			base: process.cwd(),
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				author: null,
			}));
		return sandbox.thenable(stream);
	});

	it('not fail with only warning', () => {
		const stream = vfs.src('test/fixtures/postcss/empty-block-with-disables.css', {
			base: process.cwd(),
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				output: true,
				blame: false,
			}));
		return sandbox.thenable(stream).then(() => {
			const log = sandbox.getLog();
			assert.ok(/\s+\d+:\d+/.test(log));
			assert.ok(log.indexOf('Unexpected empty block (stylelint block-no-empty http') >= 0);
		});
	});

	it('console reporter', () => {
		const stream = vfs.src('test/fixtures/postcss/invalid.css', {
			base: process.cwd(),
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				output: true,
				author: null,
			}));
		return sandbox.gotError(stream).then(error => {
			const reMessage = /^\d+:\d+\s+.+?\s+\(\w+\s+\w+(-\w+)*\s+https?:\/\/(goo\.gl|t\.cn)\/\w+\)$/;
			const reBlame = /^\w+…?\s\(\S+.*?\s+<.+?>\s+\d+.+?\)$/;
			const reSource = /^\d+|\s*.*?\S$/;

			assert.strictEqual(error.plugin, 'gulp-reporter');
			assert.strictEqual(error.message, 'Lint failed for: test/fixtures/postcss/invalid.css');
			const log = sandbox.getLog().split(/\s*\r?\n\s*/g);
			assert.strictEqual(log[0], 'test/fixtures/postcss/invalid.css');
			assert.ok(reMessage.test(log[1]));
			assert.ok(reMessage.test(log[4]));

			assert.ok(reSource.test(log[2]));
			assert.ok(reSource.test(log[5]));

			assert.ok(reBlame.test(log[3]));
			assert.ok(reBlame.test(log[6]));
		});
	});

	it('browser reporter', () => {
		const stream = vfs.src('test/fixtures/postcss/invalid.css', {
			base: process.cwd(),
		})

			.pipe(postcss([
				stylelint,
			]))
			.pipe(reporter({
				browser: true,
				fail: false,
				author: null,
			})).on('data', file => {
			});

		return sandbox.thenable(stream).then(files => {
			files.forEach(file => {
				const contents = file.contents.toString();
				assert.ok(/\W+test\W+fixtures\W+postcss\W+invalid\.css\b/i.test(contents));
				assert.ok(/\d+:\d+/.test(contents));
				assert.ok(/\bUnexpected vendor-prefix/.test(contents));
			});
		});
	});
});
