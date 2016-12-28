'use strict';
const LintError = require('./lint-error');
class JshintError extends LintError {
	constructor(error) {
		super({
			// jshint无警告，错误等级全部算错误
			severity: 'error',

			// 行号
			lineNumber: error.line,

			// 列号
			columnNumber: error.character,

			// 错误信息
			message: error.reason,

			// 错误ID
			rule: error.code,

			// 源代码上下文
			source: error.evidence,

			// 报错插件
			plugin: 'JSHint',

		}, error);
		this.name = 'JSHint';
	}
}

module.exports = JshintError;
