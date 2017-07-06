'use strict';
const logSymbols = require('log-symbols');
const gutil = require('gulp-util');
const path = require('path');
const emphasize = require('emphasize');
const icon = Object.assign({
	warn: logSymbols.warning,
}, logSymbols);

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


function formater(error) {
	const message = [];

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

module.exports = formater;
