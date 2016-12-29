'use strict';
const ESLINT_SEVERITY_MAP = {
	'1': 'warn',
	'2': 'error',
};
const LintError = require('./lint-error');

class EslintError extends LintError {
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
		}, error);

		this.name = 'ESLint';
		// 错误等级
		this.severity = ESLINT_SEVERITY_MAP[String(error.severity)] || this.severity;
	}
}

module.exports = EslintError;
