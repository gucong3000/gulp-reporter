'use strict';
const vfs = require('vinyl-fs');
const eslint = require('gulp-eslint');
const reporter = require('../');
const path = require('path');

vfs.src('test/fixtures/eslint/invalid.js', {
	cwd: path.join(__dirname, '..')
})
	.pipe(eslint())
	.pipe(reporter());
