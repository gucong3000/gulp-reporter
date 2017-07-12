'use strict';
const logSymbols = require('log-symbols');
const gutil = require('gulp-util');
const path = require('path');
const emphasize = require('emphasize');
const cliTruncate = require('cli-truncate');
const stringWidth = require('string-width');

const icon = Object.assign({
	warn: logSymbols.warning,
}, logSymbols);
const msgColor = {
	info: gutil.colors.blue,
	default: gutil.colors.green,
	warn: gutil.colors.yellow,
	error: gutil.colors.red,
};

function highlight(error) {
	let source = error.source;
	if (gutil.colors.enabled) {
		const extname = path.extname(error.fileName).slice(1);
		if (extname) {
			try {
				return emphasize.highlight(extname.slice(1), source).value;
			} catch (ex) {
				//
			}
		}
		source = emphasize.highlightAuto(source).value;
	}
	return source;
}

function padNum(num, width) {
	num = String(num);
	if (num.length < width) {
		num = '0'.repeat(width - num.length) + num;
	}
	return num;
}
function padEnd(str, width) {
	const widthComp = width - stringWidth(str);
	if (widthComp > 0) {
		str += ' '.repeat(widthComp);
	}
	return str;
}

function addLineNumbers(code, line, fmtOpts) {
	function add(s) {
		let prefix = ' '.repeat(fmtOpts.columnNumberWidth + 1);
		prefix += gutil.colors.yellow(padNum(line, fmtOpts.lineNumberWidth) + ' | ');
		line++;
		return prefix + s;
	}
	return code.replace(/^.*$/gm, add);
}

function formatError(error, fmtOpts) {
	const message = [];

	function subMsg(msg) {
		msg = msg.filter(Boolean);
		if (msg.length) {
			return `(${ msg.join(' ') })`;
		}
	}

	function addMsg(msg, color) {
		msg = msg.filter(Boolean);
		const widthComp = fmtOpts.termColumns - 6 - msg.reduce(function(width, msg) {
			return width + stringWidth(msg);
		}, msg.length);

		if (widthComp > 0) {
			const last = msg[msg.length - 1];
			msg[msg.length - 1] = ' '.repeat(widthComp) + last;
		}
		msg = msg.join(' ');
		if (color) {
			msg = gutil.colors[color](msg);
		}
		message.push(msg);
	}

	const link = error.docShort || error.doc;

	addMsg([
		error.lineNumber && '[' + gutil.colors.gray(`${ padNum(error.lineNumber, fmtOpts.lineNumberWidth) }:${ padNum(error.columnNumber, fmtOpts.columnNumberWidth)}`) + ']',
		icon[error.severity] || icon.warn,
		(error.severity && msgColor[error.severity] || msgColor.default)(error.message),
		subMsg([error.plugin, error.rule, link && gutil.colors.underline(link)]),
	]);

	if (error.source) {
		let source = fmtOpts.sourceCache[error.source];
		if (!source) {
			// source = ' '.repeat(fmtOpts.lineNumberWidth + fmtOpts.columnNumberWidth + 4);
			source = highlight(error);
			source = addLineNumbers(source, error.lineNumber || 1, fmtOpts);
			source = cliTruncate(source, fmtOpts.termColumns - 5);
			fmtOpts.sourceCache[error.source] = source;
		}
		message.push(source);
	}

	if (error.blame) {
		addMsg([
			error.blame.hash,
			subMsg([
				padEnd(error.blame.author.name, fmtOpts.nameWidth),
				padEnd(`<${ error.blame.author.mail }>`, fmtOpts.emailWidth + 2),
				new Date(error.blame.author.time * 1000).toLocaleString()
			])
		], 'gray');
	}

	return message.join('\n');
}

function formater(file, options) {
	const sourceCache = {};
	let maxLineNumber = 0;
	let maxColumnNumber = 0;
	let nameWidth = 0;
	let emailWidth = 0;
	let errors = file.report.errors;
	errors.forEach(error => {
		if (error.lineNumber > maxLineNumber) {
			maxLineNumber = error.lineNumber;
		}
		if (error.columnNumber > maxColumnNumber) {
			maxColumnNumber = error.columnNumber;
		}
		if (error.blame) {
			nameWidth = Math.max(stringWidth(error.blame.author.name), nameWidth);
			emailWidth = Math.max(stringWidth(error.blame.author.mail), nameWidth);
		}
	});
	const fmtOpts = {
		sourceCache,
		nameWidth,
		emailWidth,
		lineNumberWidth: Math.max(String(maxLineNumber).length, 2),
		columnNumberWidth: Math.max(String(maxColumnNumber).length, 2),
		termColumns: options._termColumns,
	};
	errors = errors.map(error => (
		formatError(error, fmtOpts).replace(/^/gm, '\t')
	));
	errors.unshift(gutil.colors.cyan.underline(path.relative(file.cwd, file.path).replace(/\\/g, '/')));
	return errors.join('\n').replace(/\t/g, '    ');
}

module.exports = formater;
