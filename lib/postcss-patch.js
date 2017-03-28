'use strict';
let filename;
try {
	filename = require.resolve('gulp-postcss');
} catch (ex) {
	//
}

if (filename) {
	if (require.cache[filename]) {
		throw new Error('`gulp-reporter` must loaded before `gulp-postcss`');
	}
	const fs = require('fs');
	module.parent.require(filename);
	const postcss = require.cache[filename];
	let content = fs.readFileSync(filename, 'utf8');
	content = content.replace(/\bresult.warnings\([^\r\n]+/, '(file.postcss=result)&&""');
	postcss._compile(content, filename);
	module.exports = postcss.exports;
}
