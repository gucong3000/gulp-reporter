'use strict';
const gutil = require('gulp-util');
const formater = require('./formater');

/**
 * 在控制台打印错误信息
 *
 * @param {vinyl} file 包含错信息的文件对象
 * @param {Function} logger 接受错误信息的函数
 */
function consoleReporter(file, logger) {
	(logger || gutil.log)(formater(file));
}

module.exports = consoleReporter;
