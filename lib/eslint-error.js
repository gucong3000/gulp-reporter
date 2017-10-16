'use strict';
const LintError = require('./lint-error');
const locale = require('./locale');
/**
 * ESLint错误对象
 *
 * @class ESLintError
 * @extends {LintError}
 */
class ESLintError extends LintError {
	/**
	 * Creates an instance of ESLintError.
	 *
	 * @param {Object} error eslint原生错误对象
	 *
	 * @memberOf ESLintError
	 */
	constructor(error) {
		super({
			// 错误等级默认error，后面会覆盖
			severity: 'error',

			// 行号
			lineNumber: error.line,

			// 列号
			columnNumber: error.column,

			// 错误信息
			// message: error.message,

			// 触发错误的规则
			rule: error.ruleId,

			// 源代码上下文
			// source: error.source,

			// 报错插件
			plugin: 'ESLint',

			// 文档
			doc: error.ruleId && `https://${ locale === 'zh_CN' ? 'cn.' : '' }eslint.org/docs/rules/${ error.ruleId }`
		}, error, {
			// 错误等级
			severity: (error.fatal || error.severity === 2) ? 'error' : 'warn',
		});
	}
}

module.exports = ESLintError;
