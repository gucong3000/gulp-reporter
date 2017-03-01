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
			// JSHint无警告，错误等级全部算错误
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

		}, error);
		this.name = 'JSHint';
	}
}

module.exports = JSHintError;
