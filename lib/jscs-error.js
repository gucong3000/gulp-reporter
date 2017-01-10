'use strict';
const LintError = require('./lint-error');
class JscsError extends LintError {
	constructor(error) {
		// console.log(error);
		super({

			// 文件名
			fileName: error.filename,

			// JSCS无警告，错误等级全部算错误
			severity: 'error',

			// 行号
			lineNumber: error.line,

			// 列号
			columnNumber: error.column,

			// 错误信息
			// message: error.message,

			// 错误ID
			// rule: error.rule,

			// 源代码上下文
			source: error.element._sourceCode,

			// 报错插件
			plugin: 'JSCS',

		}, error);
		error = this;
		error.name = 'JSCS';
		if (error.message && error.rule) {
			error.message = error.message.replace(new RegExp('^' + error.rule + '\\:\\s*'), '');
		}
	}
}

module.exports = JscsError;
