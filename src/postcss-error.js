'use strict';
const POSTCSS_SEVERITY_MAP = {
	'warning': 'warn',
};
const LintError = require('./lint-error');

class PostcssError extends LintError {
	constructor(error) {
		super({

			// 文件名
			fileName: error.file || (error.input && error.input.file),

			// 错误等级默认error，后面会覆盖
			severity: 'error',

			// 行号
			lineNumber: error.line,

			// 列号
			columnNumber: error.column,

			// 错误信息
			message: error.text.replace(new RegExp('\\s*\\(' + error.rule + '\\)$'), ''),

			// 错误ID
			rule: error.rule,

			// 源代码上下文
			source: (error.node && error.node.type && error.node.type !== 'root') ? String(error.node) : '',

			// 报错插件
			plugin: 'PostCSS',
		}, error);
		// 错误等级
		this.severity = POSTCSS_SEVERITY_MAP[String(error.severity)] || this.severity;
		this.name = 'PostCSS';
	}
}

module.exports = PostcssError;
