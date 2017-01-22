'use strict';
const PostcssError = require('./postcss-error');
const EslintError = require('./eslint-error');
const JshintError = require('./jshint-error');
const TslintError = require('./tslint-error');
const JscsError = require('./jscs-error');
const sortError = require('./sort-errors');
const gitBlame = require('./git-blame');


/**
 * 提取`file`中的postcss、eslint、tslint、jscs、jshint等错误
 *
 * @param {Vinyl}  file    需要检查的文件
 * @param {Object} options 参数，这里要使用options.sort和options.filter
 * @returns {Promise} <Array>
 */
function getErrors (file, options) {
	// 开始收集错误
	var errors = [];
	if (file.postcss) {
		file.postcss.messages.forEach(message => errors.push(new PostcssError(message)));
	}
	if (file.eslint) {
		file.eslint.messages.forEach(message => errors.push(new EslintError(message, file)));
	}
	if (file.tslint) {
		file.tslint.failures.forEach(failure => errors.push(new TslintError(failure)));
	}
	if (file.jscs && !file.jscs.success) {
		file.jscs.errors.getErrorList().forEach(error => errors.push(new JscsError(error)));
	}
	if (file.jshint && !file.jshint.success && !file.jshint.ignored) {
		file.jshint.results.forEach(result => errors.push(new JshintError(result.error)));
	}

	// 所务收集完成
	if (errors.length) {
		// 获取git blame信息
		return gitBlame(file).catch(() => {
			return;
		}).then(blame => {
			// blame信息写入error对象
			errors.forEach(function(error) {
				if (!error.fileName) {
					error.fileName = file.path;
				}
				const lineInfo = blame && error.lineNumber && blame[error.lineNumber];
				if (lineInfo) {
					error.authorName = lineInfo.name;
					error.authorEmail = lineInfo.email;
					error.commitHash = lineInfo.hash;
					error.commitTime = lineInfo.time;
				}
			});

			// 错误排序
			if (options.sort) {
				errors = sortError(errors, typeof options.sort === 'function' ? options.sort : null);
			}

			// 错误筛选
			if (options.filter) {
				errors = options.filter.reduce((errors, filter) => {
					return errors.then(errors => {
						return filter(errors, file);
					}).then(result => {
						if (Array.isArray(result)) {
							errors = result.filter(Boolean);
						}
						return errors;
					});
				}, Promise.all(errors));
			}

			return errors;
		});
	}

	return Promise.resolve(errors);
}

module.exports = getErrors;
