'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var eslintSeverityMap = {
	'1': 'warn',
	'2': 'error',
};
var postcssSeverityMap = {
	'warning': 'warn',
};

/**
 * 代码错误汇报函数，在浏览器中运行，用于将收集到的js的错误信息在浏览器控制台中弹出
 * 注意！！此函数将被toString()后发送到浏览器，并非在node下运行！！
 * @param  {Array}		errors			错误信息
 * @param  {String}		path			js文件相对路径
 * @return {undefined}
 */
var jsBrowserReporter = (function(errors, path) {

	/* eslint-env browser */
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
}).toString().replace(/^(function)\s*\w+/, '$1');

/**
 * 代码错误汇报函数，在浏览器中运行，用于将收集到的CSS错误信息在页面上弹出
 * @param  {Array}		errors			错误信息
 * @param  {String}		uri				css文件路径
 * @return {undefined}
 */
function cssBrowserReporter(errors, uri) {

	var warnIcon = encodeURIComponent(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="48px" height="48px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve"><path fill="#A82734" id="warning-4-icon" d="M228.55,134.812h54.9v166.5h-54.9V134.812z M256,385.188c-16.362,0-29.626-13.264-29.626-29.625c0-16.362,13.264-29.627,29.626-29.627c16.361,0,29.625,13.265,29.625,29.627C285.625,371.924,272.361,385.188,256,385.188z M256,90c91.742,0,166,74.245,166,166c0,91.741-74.245,166-166,166c-91.742,0-166-74.245-166-166C90,164.259,164.245,90,256,90z M256,50C142.229,50,50,142.229,50,256s92.229,206,206,206s206-92.229,206-206S369.771,50,256,50z"/>
</svg>`);
	errors = errors.map(error => {
		var pos;
		if (error.lineNumber && error.columnNumber) {
			pos = `[${ error.lineNumber }:${ error.columnNumber }] `;
		} else {
			pos = '';
		}
		var subMsg = [error.plugin];
		if (error.rule) {
			subMsg.push(error.rule);
		}
		return `${ pos }${ error.message } (${ subMsg.join(' ') })`.replace(/"/g, '\\"');
	});
	errors.unshift(uri);
	var styles = {
		'display': 'block',
		'position': 'sticky',

		'margin': '1em',
		'font-size': '.9em',
		'padding': '1.5em 1em 1.5em 4.5em',

		/* padding + background image padding */

		/* background */
		'color': 'white',
		'background-color': '#df4f5e',
		'background': `url("data:image/svg+xml;charset=utf-8,${ warnIcon }") .5em 1.5em no-repeat, #DF4F5E linear-gradient(#DF4F5E, #CE3741)`,

		/* sugar */
		'border': '1px solid #c64f4b',
		'border-radius': '3px',
		'box-shadow': 'inset 0 1px 0 #eb8a93, 0 0 .3em rgba(0,0,0, .5)',

		/* nice font */
		'white-space': 'pre-wrap',
		'font-family': 'Menlo, Monaco, monospace',
		'text-shadow': '0 1px #a82734',
		'content': `"${ errors.join('\\00000a') }"`
	};
	var css = '\nhtml::before {\n';
	for (var key in styles) {
		css += `\t${ key }: ${ styles[key] };\n`;
	}
	return css + '}\n';
}

/**
 * 检查代码去除块注释后、去掉特别长的行、合并连续换行符之后，还有有几行
 * @param  {String} code 要检查的代码
 * @return {Number}      代码行数
 */
function lineCount(code) {
	var lineCount = code.replace(/\/\*(?:.|\r?\n)+?\*\//g, '').replace(/(?:^|\r?\n)[^\r\n]{300,}(?:\r?\n|$)/g, '\n').replace(/(?:\r?\n)+/g, '\n').trim().match(/\n/g);
	return lineCount ? lineCount.length : 0;
}

/**
 * 检查代码是否压缩版本
 * @param  {Buffer|String} contents 要检查的代码
 * @return {Boolean}       代码是否压缩版
 */
function isMinFile(contents) {
	contents = contents.toString();
	return !contents || /\bsourceMappingURL=[^\n]+\.map\b/.test(contents) || lineCount(contents) < 3;
}

/**
 * 判断文件是否应该忽略，如果文件名为*.min.*\*-min.*，或者代码为压缩代码，则返回true
 * @param  {Vinyl}  file 需要检查的文件
 * @return {Boolean}      文件是否为压缩文件
 */
function isIgnore(file) {
	return file.isNull() || /[\.\-]min\.\w+$/.test(file.relative) || isMinFile(file.contents);
}

/**
 * 将错误等级的字符串转化为排序所用的权重
 * @param  {String} severity 错误等级
 * @return {Int}          排序权重
 */
function severity2num(severity) {
	if (!severity) {
		severity = 0;
	} else if (severity === 'error') {
		severity = 1;
	} else if (severity === 'warn') {
		severity = 2;
	} else {
		severity = 3;
	}
	return severity;
}

/**
 * 对错误信息排序的函数
 * @param  {Array} errors 待排序的错误数组与
 * @return {Array}        [description]
 */
function sortError(errors) {
	return errors.sort(function(err1, err2) {
		if (err1.severity !== err2.severity) {
			return severity2num(err1.severity) - severity2num(err2.severity);
		} else if (err1.lineNumber === err2.lineNumber) {
			return (err1.columnNumber || 0) - (err1.columnNumber || 0);
		} else {
			return (err1.lineNumber || 0) - (err2.lineNumber || 0);
		}
	});
}

/**
 * 在文件内容上追加错误汇报信息
 * @param  {Buffer} buf    文件内容buffer
 * @param  {Array}  errors 错误信息
 * @param  {Vinyl}  file 需要检查的文件
 * @return {Buffer}        新的文件内容
 */
function appendReporter(buf, errors, file) {

	var uri = file.relative.replace(/\\/g, '/');

	// 在buffer中的代码中注入报错语句
	var contentReporter;

	if (file.postcss) {
		contentReporter = cssBrowserReporter(errors, uri);
	} else if (file.jshint || file.eslint) {
		contentReporter = `\n;\n(${ jsBrowserReporter })(${ JSON.stringify(errors) }, ${ JSON.stringify(uri) });`;
	}

	return Buffer.concat([buf, new Buffer(contentReporter)]);
}

/**
 * 为Vinyl对象追加错误汇报内容
 * @param  {Vinyl}  file   要处理的文件
 * @param  {Array}  errors 错误信息
 * @return {undefined}
 */
function browserReporter(file, errors) {
	if (file.isStream()) {
		var BufferStreams = require('bufferstreams');
		file.contents = file.contents.pipe(new BufferStreams((err, buf, done) => {
			done(null, appendReporter(buf, errors, file));
		}));
	} else if (file.isBuffer()) {
		file.contents = appendReporter(file.contents, errors, file);
	}
}

/**
 * 在进程的控制台弹出错误消息
 * @param  {Vinyl}  file   要汇报的文件
 * @param  {Array}  errors 错误信息
 * @return {undefined}
 */
function consoleReporter(file, errors) {
	errors = errors.map(error => {
		var message = [];

		if (error.lineNumber) {
			message.push('[' + gutil.colors.gray(`${ error.lineNumber }:${ error.columnNumber || 0 }`) + ']');
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
			message += gutil.colors.green(error.source.replace(/^[\r\n]*/, '\n'));
		}

		return message;
	});

	errors.unshift(gutil.colors.cyan.underline(file.relative.replace(/\\/g, '/')));
	gutil.log(gutil.colors.bgBlack(errors.join('\n')));
}

/**
 * 将错误报告分发给参数指定的各个模块
 * @param  {Vinyl}  file    要汇报的文件
 * @param  {Array}  errors  错误信息
 * @param  {[type]} options 参数对象
 * @return {undefined}
 */
function reporter(file, errors, options) {
	if (options.inBrowser) {
		browserReporter(file, errors);
	}
	process.nextTick(() => {
		if (options.inConsole || options.inConsole == null) {
			consoleReporter(file, errors);
		}
		if (options.inJSON) {
			options.inJSON(file, errors);
		}
	});
}

module.exports = function(options) {
	options = options || {};

	var inBrowser = options.inBrowser;
	var fail = options.fail;
	var fails = [];

	if (fail == null) {
		fail = !inBrowser;
	}

	return through.obj({
		objectMode: true
	}, function(file, encoding, done) {
		var errors = [];

		if (isIgnore(file)) {
			file.report = {
				ignore: true
			};
			return done(null, file);
		}
		if (file.postcss) {

			// 查找postcss错误信息
			if (file.postcss.messages.length) {
				errors.push.apply(errors, file.postcss.messages.map(msg => {
					return {

						// 错误等级
						severity: postcssSeverityMap[String(msg.severity)] || msg.severity,

						// 行号
						lineNumber: msg.line,

						// 列号
						columnNumber: msg.column,

						// 错误信息
						message: msg.text.replace(new RegExp('\\s*\\(' + msg.rule + '\\)$'), ''),

						// 错误ID
						rule: msg.rule,

						// 源代码上下文
						source: (msg.node && msg.node.type && msg.node.type !== 'root') ? String(msg.node) : '',

						// 报错插件
						plugin: msg.plugin || 'PostCSS',
					};
				}));
			}
		} else {
			if (file.eslint) {

				// 查找eslint错误信息
				if (file.eslint.messages.length) {
					errors.push.apply(errors, file.eslint.messages.map(msg => {
						return {

							// 错误等级
							severity: eslintSeverityMap[String(msg.severity)] || msg.severity,

							// 行号
							lineNumber: msg.line,

							// 列号
							columnNumber: msg.column,

							// 错误信息
							message: msg.message,

							// 错误ID
							rule: msg.ruleId,

							// 源代码上下文
							source: msg.source,

							// 报错插件
							plugin: 'ESLint',
						};
					}));
				}
			}
			if (file.jshint) {

				// 查找jshint错误信息
				if (!file.jshint.success && !file.jshint.ignored) {
					errors.push.apply(errors, file.jshint.results.map(result => {
						return {

							// jshint无警告，全部算错误
							severity: 'error',

							// 行号
							lineNumber: result.error.line,

							// 列号
							columnNumber: result.error.character,

							// 错误信息
							message: result.error.reason,

							// 错误ID
							rule: result.error.code,

							// 源代码上下文
							source: result.error.evidence,

							// 报错插件
							plugin: 'JSHint',
						};
					}));
				}
			}
		}

		if (errors && errors.length) {
			errors = sortError(errors);
			reporter(file, errors, options);
			if (errors.some(error => error.severity === 'error')) {
				fails.push(file.relative.replace(/\\/g, '/'));
			}
		}
		file.report = {
			errors
		};
		done(null, file);
	}, function(done) {

		// 流程结束后信息汇总
		process.nextTick(() => {

			// 没有发现错误
			if (!fails.length) {
				return done();
			}
			var message = 'Lint failed for: ' + fails.join(', ');

			// 发出报警声
			gutil.beep();
			fails = [];
			if (!fail) {

				// 配置要求不抛出异常
				gutil.log(message);
				done();
				return;
			}

			process.nextTick(done);
			this.emit('error', new gutil.PluginError('gulp-reporter', {
				message: message,
				showStack: false
			}));
		});
	});
};
