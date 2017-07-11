'use strict';
const logSymbols = require('log-symbols');
const gutil = require('gulp-util');
const path = require('path');
const emphasize = require('emphasize');
const ellipsis = require('text-ellipsis');
const icon = Object.assign({
	warn: logSymbols.warning,
}, logSymbols);

function highlight(error, maxLineLength) {
	let source = error.source;
	if (maxLineLength) {
		source = ellipsis(source, maxLineLength);
	}
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
		return prefix + s;
	}
	return code.replace(/^.*$/gm, add);
}


function formatError(error, cache, maxLineLength) {
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
			cache[error.source] || (cache[error.source] = addLineNumbers(highlight(error, maxLineLength), error.lineNumber))
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

function formater(file, options) {
	const cache = {};
	const errors = file.report.errors.map(error => (
		formatError(error, cache, options.maxLineLength).replace(/^/gm, '\t')
	));
	errors.unshift(gutil.colors.cyan.underline(path.relative(file.cwd, file.path).replace(/\\/g, '/')));
	return errors.join('\n').replace(/\t/g, '    ');
}

module.exports = formater;
