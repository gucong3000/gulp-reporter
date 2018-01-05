'use strict';
const LintError = require('./lint-error');
/**
 * stylint错误对象
 *
 * @class StyLintError
 * @extends {LintError}
 */
class StyLintError extends LintError {
	/**
	 * Creates an instance of StyLintError.
	 *
	 * @param {Object} message stylint的原始error对象
	 *
	 * @memberOf StyLintError
	 */
	constructor (message) {
		const error = {
			// 依靠gulp-stylint现有的API无法获取错误等级，暂时先按error处理
			severity: 'error',

			// 报错插件
			plugin: 'StyLint',
		};
		message.replace(/^(.+?):\s*(.+?)$/gm, function (s, key, value) {
			if (/^(?:error|message)$/i.test(key)) {
				key = 'message';
			} else if (/^file(?:Name)?$/i.test(key)) {
				key = 'fileName';
			} else if (/^line(?:Number)?$/i.test(key)) {
				key = 'lineNumber';
				value = +value.replace(/^(\d+)(?::\s*)?(.*?)$/, '$1');
				if (RegExp.$2) {
					error.source = RegExp.$2;
				}
			} else {
				key = key.toLocaleLowerCase();
			}
			error[key] = value;
		});

		super(error);
	}
}

module.exports = StyLintError;
