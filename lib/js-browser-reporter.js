'use strict';
/* eslint-env browser */
/* eslint no-console: "off" */
/* eslint no-var: "off" */

/**
 * 代码错误汇报函数，在浏览器中运行，用于将收集到的js的错误信息在浏览器控制台中弹出
 * 注意！！此函数将被toString()后发送到浏览器，并非在node下运行！！
 * @param  {Array}		errors			错误信息
 * @param  {String}		uri			    js文件url
 * @return {undefined}
 */
function jsBrowserReporter(errors) {
	// 延迟运行，以免干扰js正常运行流程
	setTimeout(function() {

		// 将文件路径与模块路径拼接为完整的url
		errors.forEach(window.Error && 'fileName' in Error.prototype ? function(err) {

			// 方式一：new Error，对error的属性赋值，然后throw
			var errorObj;
			var message = err.message + ' (' + [
				err.plugin,
				err.rule,
				err.doc,
			].filter(Boolean).join(' ') + ')';

			try {
				errorObj = new SyntaxError(message);
			} catch (ex) {
				errorObj = new Error(message);
			}

			// 设置文件路径
			errorObj.fileName = 'file://' + err.fileName.replace(/^(\w:)\\/, '/$1/').replace(/\\/g, '/');

			// 设置行号
			errorObj.lineNumber = err.lineNumber;

			// 设置列号
			errorObj.columnNumber = err.columnNumber;

			// 抛出错误
			if (err.severity === 'error') {
				setTimeout(function() {
					throw errorObj;
				}, 0);
			} else if (console[err.severity]) {
				console[err.severity](errorObj);
			} else {
				console.warn(errorObj);
			}
		} : function(err) {

			var fileName = 'file://' + err.fileName.replace(/^(\w:)\\/, '/$1/').replace(/\\/g, '/');

			// 方式二：console方式汇报错误
			var message = ('SyntaxError: ${ message } (${ plugin } ${ rule })\n\tat (' + fileName + ':${ lineNumber }:${ columnNumber })');

			if (err.doc) {
				message += '\n\tat (${ doc })';
			}

			message = message.replace(/\$\{\s*(\w+)\s*\}/g, function(s, key) {
				return err[key] || s;
			});

			try {

				// 如果你追踪错误提示来找到这一行，说明你来错误了地方，请按控制台中提示的位置去寻找代码。
				console[err.severity](message);
			} catch (ex) {
				try {

					// 如果你追踪错误提示来找到这一行，说明你来错误了地方，请按控制台中提示的位置去寻找代码。
					console.log(message);
				} catch (ex) {
					//
				}
			}
		});
	}, 0);
}

module.exports = jsBrowserReporter.toString().replace(/^(function)\s*\w+/m, '$1');
