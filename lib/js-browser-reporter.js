'use strict';
/* eslint-env browser */
/* eslint no-console: "off" */
/* eslint no-var: "off" */

/**
 * 代码错误汇报函数，在浏览器中运行，用于将收集到的js的错误信息在浏览器控制台中弹出
 * 注意！！此函数将被toString()后发送到浏览器，并非在node下运行！！
 * @param  {Array}		errors			错误信息
 * @param  {String}		path			js文件相对路径
 * @return {undefined}
 */
function jsBrowserReporter(errors, path) {

	var uri;

	// 利用e.stack来分析出js文件所在路径，IE不支持
	try {
		throw new Error('_');
	} catch (e) {
		try {
			e.stack.replace(/(?:\bat\b|@).*?(\b\w+\:\/{2,}.*?)(?:\:\d+){2,}/, function(m, url) {
				uri = url;
			});
		} catch (ex) {
			//
		}
	}

	// 利用<script>的readyState，查找js文件所在路径
	uri = uri || (function() {

		// 页面上所有的<script>标签
		var scripts = document.scripts || document.getElementsByTagName('script');
		var lastSrc;

		// 倒序遍历所有<script>
		for (var i = scripts.length - 1; i >= 0; i--) {
			var script = scripts[i];

			// <script>含有src属性
			if (script.src) {

				// script.readyState应该是只支持IE的，interactive意为js还未执行完毕.
				if (script.readyState === 'interactive') {

					// 找到当前js文件路径了
					return script.src;
				}
				lastSrc = lastSrc || script.src;
			}
		}

		// 找不到当前js文件路径了，用最后一个拥有src属性的<script>标签的src属性值充数
		return lastSrc;
	})();

	// 获取js文件当前路径
	if (!uri) {
		return;
	}

	// 延迟运行，以免干扰js正常运行流程
	setTimeout(function() {

		// 将文件路径与模块路径拼接为完整的url
		uri = uri.replace(/^((?:\w+\:)?\/{2,}[^\/]+\/)?.*$/, '$1' + path);
		var unshowMsg = '';
		errors.forEach(window.Error && 'fileName' in Error.prototype ? function(err) {
			var message = err[3] + '\t(' + err[4] + ')';

			// 方式一：new Error，对error的属性赋值，然后throw
			var errorObj;
			try {
				errorObj = new SyntaxError(message);
			} catch (ex) {
				errorObj = new Error(message);
			}

			// 设置文件路径
			errorObj.fileName = uri;

			// 设置行号
			errorObj.lineNumber = err.lineNumber;

			// 设置列号
			errorObj.columnNumber = err.columnNumber;

			// 设置消息
			errorObj.message = err.message;

			var subMsg = [];

			if (err.plugin) {
				subMsg.push(err.plugin);
			}

			if (err.rule) {
				subMsg.push(err.rule);
			}

			if (subMsg.length) {
				errorObj.message += ' (' + subMsg.join(' ') + ')';
			}

			// 抛出错误
			if (err.severity === 'error') {
				setTimeout(function() {
					throw errorObj;
				}, 0);
			} else {
				console.warn(errorObj);
			}
		} : function(err) {

			// 方式二：console方式汇报错误
			err = ('SyntaxError: ${ message } (${ plugin } ${ rule })\n\tat (' + uri + ':${ lineNumber }:${ columnNumber })').replace(/\$\{\s*(\w+)\s*\}/g, function(s, key) {
				return err[key] || s;
			}).replace(/[\s\:]\$\{.+?\}/g, '');

			try {

				// 如果你追踪错误提示来找到这一行，说明你来错误了地方，请按控制台中提示的位置去寻找代码。
				console[err.severity](err);
			} catch (ex) {
				try {

					// 如果你追踪错误提示来找到这一行，说明你来错误了地方，请按控制台中提示的位置去寻找代码。
					console.log(err);
				} catch (ex) {

					// 不支持console的浏览器中，记录下消息，稍后alert
					unshowMsg += err + '\n';
				}
			}
		});

		// 不支持console.error的浏览器，用alert弹出错误
		if (unshowMsg) {
			alert(unshowMsg);
		}
	}, 200);
}

module.exports = jsBrowserReporter.toString().replace(/^(function)\s*\w+/m, '$1');
