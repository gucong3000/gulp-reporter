'use strict';
const gutil = require('gulp-util');
const path = require('path');
const formater = require('./formater');

/**
 * 在控制台打印错误信息
 *
 * @param {vinyl} file 包含错信息的文件对象
 * @param {Function} logger 接受错误信息的函数
 */
function consoleReporter(file, logger) {
	const errors = file.report.errors.map(err => formater(err).replace(/^/gm, '\t'));
	errors.unshift(gutil.colors.cyan.underline(path.relative(file.cwd, file.path).replace(/\\/g, '/')));
	(logger || gutil.log)(errors.join('\n').replace(/\t/g, '    '));
}

module.exports = consoleReporter;
