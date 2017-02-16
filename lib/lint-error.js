'use strict';
const gutil = require('gulp-util');
const icon = {
	// emoji
	error: gutil.colors.red('\u{274C}\u{FE0F}'),
	warn: gutil.colors.yellow('\u{26A0}\u{FE0F}'),
};

/**
 * 统一的，错误对象
 *
 * @class LintError
 * @extends {Error}
 */
class LintError extends Error {
	/**
	 * Creates an instance of LintError.
	 *
	 *
	 * @memberOf LintError
	 */
	constructor() {
		super();
		let args = Array.from(arguments);
		args.unshift(this);
		Object.assign.apply(Object, args);
	}

	/**
	 *
	 * 格式化的错误信息
	 * @returns {String} 格式化的错误信息
	 *
	 * @memberOf LintError
	 */
	toString() {
		let message = [];
		let error = this;

		function subMsg(msg) {
			msg = msg.filter(Boolean);
			if (msg.length) {
				return `(${ msg.join(' ') })`;
			}
		}

		function addMsg(msg, color) {
			msg = msg.filter(Boolean).join(' ');
			if (color) {
				msg = gutil.colors[color](msg);
			}
			message.push(msg);
		}

		addMsg([
			error.lineNumber && '[' + gutil.colors.gray(`${ error.lineNumber }:${ error.columnNumber || 0 }`) + ']',
			error.severity === 'warn' ? icon.warn : icon.error,
			gutil.colors[error.severity === 'warn' ? 'yellow' : 'red'](error.message),
			subMsg([error.plugin, error.rule, error.doc && gutil.colors.underline(error.doc)]),
		]);

		if (error.source) {
			addMsg([
				error.source.replace(/^[\r\n]*/m, '\t').replace(/\r?\n/g, '\n\t')
			], 'green');
		}

		if (error.commitHash) {
			addMsg([
				error.commitHash,
				subMsg([
					error.authorName,
					error.authorEmail && `<${ error.authorEmail }>`,
					error.commitTime.toLocaleString()
				])
			], 'gray');
		}

		return message.join('\n');
	}

	/**
	 * console.log会自动调用的函数
	 *
	 * @returns {String} 模拟Error对象的格式的错误信息的字符串
	 *
	 * @memberOf LintError
	 */
	inspect() {
		return `${ this.name }: ${ this.message } (${ this.plugin } ${ this.rule })\n    at (${ this.fileName }:${ this.lineNumber }:${ this.columnNumber })`;
	}
}

module.exports = LintError;
