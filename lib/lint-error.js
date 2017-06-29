'use strict';
const gutil = require('gulp-util');
const path = require('path');
const emphasize = require('emphasize');
const locale = require('./locale');
const logSymbols = require('log-symbols');
const icon = Object.assign({
	warn: logSymbols.warning,
}, logSymbols);

const I18N_CACHE = {

};

function i18n(error) {
	if (locale === 'en_US') {
		return error;
	}
	const key = error.plugin.toLowerCase();
	if (!(key in I18N_CACHE)) {
		try {
			I18N_CACHE[key] = require(`./${ key }_${ locale }`);
		} catch (ex) {
			I18N_CACHE[key] = false;
		}
	}
	if (I18N_CACHE[key]) {
		return I18N_CACHE[key](error);
	}
}

function highlight(error) {
	const source = error.source;
	if (gutil.colors.enabled) {
		const extname = path.extname(error.fileName).slice(1);
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
		const args = Array.from(arguments);
		args.unshift(this);
		Object.assign.apply(Object, args);
		i18n(this);
	}

	/**
	 *
	 * 格式化的错误信息
	 * @returns {String} 格式化的错误信息
	 *
	 * @memberOf LintError
	 */
	toString() {
		const message = [];
		const error = this;

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

		const link = error.docShort || error.doc;

		addMsg([
			error.lineNumber && '[' + gutil.colors.gray(`${ padNum(error.lineNumber) }:${ padNum(error.columnNumber) || 0 }`) + ']',
			gutil.colors[error.severity === 'error' ? 'red' : 'yellow'](
				(icon[error.severity] || icon.warn) +
				' ' +
				error.message
			),
			subMsg([error.plugin, error.rule, link && gutil.colors.underline(link)]),
		]);

		if (error.source) {
			addMsg([
				error.source && addLineNumbers(highlight(error), error.lineNumber)
			]);
		}

		if (error.blame) {
			addMsg([
				error.blame.hash.slice(0, 8),
				subMsg([
					error.blame.author.name,
					`<${ error.blame.author.mail }>`,
					new Date(error.blame.author.time * 1000).toLocaleString()
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
