'use strict';
const LintError = require('./lint-error');
/**
 * JSHint错误对象
 *
 * @class JSHintError
 * @extends {LintError}
 */
class JSHintError extends LintError {
	/**
	 * Creates an instance of JSHintError.
	 *
	 * @param {any} error JSHint的原始error对象
	 *
	 * @memberOf JSHintError
	 */
	constructor(error) {
		super({
			// 文件名
			fileName: error.file,

			// JSHint错误等级
			severity: !error.code || /^E/.test(error.code) ? 'error' : 'warn',

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
			name: 'JSHint',

		}, error);
	}
}

module.exports = JSHintError;
