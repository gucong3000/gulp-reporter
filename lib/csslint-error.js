'use strict';

const LintError = require('./lint-error');
const CSSLINT_SEVERITY_MAP = {
	'warning': 'warn',
};

/**
 * CssLint错误对象
 *
 * @class CssLintError
 * @extends {LintError}
 */
class CssLintError extends LintError {
	/**
	 * Creates an instance of CssLintError.
	 *
	 * @param {Object} error 原始的CssLint错误对象
	 *
	 * @memberOf CssLintError
	 */
	constructor(error) {
		const rule = error.rule || {};
		super({
			// 文件名
			// fileName: error.fileName,

			// 错误等级默认error，后面会覆盖
			severity: CSSLINT_SEVERITY_MAP[error.type] || error.type,

			// 行号
			lineNumber: error.line,

			// 列号
			columnNumber: error.col,

			// 源代码上下文
			source: error.evidence,

			// 报错插件
			plugin: 'CssLint',
			name: 'CssLint',

			// 文档
			doc: rule.url,
		}, error, {
			// 错误ID
			rule: rule.id,
		});

	}
}

module.exports = CssLintError;
