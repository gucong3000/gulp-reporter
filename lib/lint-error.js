'use strict';
const gutil = require('gulp-util');
const supportEmoji = typeof window === 'object' || process.platform !== 'win32';

class LintError extends Error {
	constructor() {
		super();
		var args = [].slice.call(arguments, 0);
		args.unshift(this);
		Object.assign.apply(Object, args);
	}

	toString() {
		var message = [];
		var error = this;

		if (error.lineNumber) {
			message.push('[' + gutil.colors.gray(`${ error.lineNumber }:${ error.columnNumber || 0 }`) + ']');
		}

		if (supportEmoji) {
			message.push(error.severity === 'warn' ? '⚠️' : '❌');
		}

		message.push(gutil.colors[error.severity === 'warn' ? 'yellow' : 'red'](error.message));

		var subMsg = [];
		if (error.plugin) {
			subMsg.push(error.plugin);
		}
		if (error.rule) {
			subMsg.push(error.rule);
		}

		if (subMsg.length) {
			message.push(`(${ subMsg.join(' ') })`);
		}

		message = message.join(' ');

		if (error.source) {
			message += gutil.colors.green(error.source.replace(/^[\r\n]*/, '\n').replace(/\r?\n/g, '\n\t'));
		}

		return message;
	}

	inspect() {
		return `${ this.name }: ${ this.message } (${ this.plugin } ${ this.rule })\n    at (${ this.fileName }:${ this.lineNumber }:${ this.columnNumber })`;
	}
}

module.exports = LintError;
