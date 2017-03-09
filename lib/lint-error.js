'use strict';
const gutil = require('gulp-util');
const path = require('path');
const emphasize = require('emphasize');
const icon = {
	// emoji
	error: '\u{274C}\u{FE0F}',
	warn: '\u{26A0}\u{FE0F}',
};

function highlight(error) {
	let source = error.source;
	if (gutil.colors.enabled) {
		let extname = path.extname(error.fileName).slice(1);
		if (extname) {
			try {
				return emphasize.highlight(extname.slice(1), source).value;
			} catch (ex) {
				//
			}
		}
		return emphasize.highlightAuto(source).value;
	}
	return source;
}

function padNum(num) {
	if (num <= 9) {
		num = '0' + num;
	} else {
		num = String(num);
	}
	return num;
}

function addLineNumbers(code, line) {
	function add(s) {
		let prefix = padNum(line);
		prefix = ' '.repeat(6 - prefix.length) + gutil.colors.yellow(prefix + '|');
		line++;
		return s + prefix;
	}
	return add('') + code.replace(/\r?\n/g, add);
}

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
			error.lineNumber && '[' + gutil.colors.gray(`${ padNum(error.lineNumber) }:${ padNum(error.columnNumber) || 0 }`) + ']',
			gutil.colors[error.severity === 'warn' ? 'yellow' : 'red'](
				(error.severity === 'warn' ? icon.warn : icon.error) +
				' ' +
				error.message
			),
			subMsg([error.plugin, error.rule, error.doc && gutil.colors.underline(error.doc)]),
		]);

		if (error.source) {
			addMsg([
				error.source && addLineNumbers(highlight(error), error.lineNumber)
			]);
		}

		if (error.commitHash) {
			addMsg([
				error.commitHash.slice(0, 8),
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
