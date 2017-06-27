'use strict';
/**
 * 过滤错误信息，将明确为其他作者所写的代码、超期的老代码的错误，错误等级标记为警告
 *
 * @param {LintError[]}   errors    已有的错误对象
 * @param {Object}        options   配置
 * @returns {void}
 */
function downgrade(errors, options) {
	errors = errors.filter(error => error.blame && !/^0+$/.test(error.blame.hash));
	if (options._timestamp) {
		errors = errors.filter(error => {
			if (error.blame.author.timestamp < options._timestamp) {
				downError(error);
			} else {
				return error;
			}
		});
	}

	const author = options.author;
	if (author) {
		if (author.email) {
			errors.filter(error => error.blame.author.mail !== author.email).forEach(downError);
		} else if (author.name) {
			errors.filter(error => error.blame.author.name !== author.name).forEach(downError);
		}
	}
}

function downError(error) {
	if (!error.severity || error.severity === 'error') {
		error.severity = 'warn';
	}
}

module.exports = downgrade;
