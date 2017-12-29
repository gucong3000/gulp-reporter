'use strict';
const LintError = require('./lint-error');
const locale = require('./locale');

const pluginDocBaseUrl = {
	flowtype: 'https://www.npmjs.com/package/eslint-plugin-flowtype#',
	gettext: 'https://www.npmjs.com/package/eslint-plugin-gettext#',
	promise: 'https://www.npmjs.com/package/eslint-plugin-promise#',
	alint: 'https://www.npmjs.com/package/eslint-plugin-alint#',
	jsdoc: 'https://www.npmjs.com/package/eslint-plugin-jsdoc#',
	sql: 'https://www.npmjs.com/package/eslint-plugin-sql#',
	standard: 'https://www.npmjs.com/package/eslint-plugin-standard#rules-explanations',
	compat: (rule, error) => (
		rule === 'compat' && error.message.replace(
			/^(?:[a-z]+\.)?(\w+).*$/,
			(s, keyWord) => (
				'https://www.caniuse.com/#search=' + keyWord.toLowerCase()
			)
		)
	),
};

/**
 * ESLint错误对象
 *
 * @class ESLintError
 * @extends {LintError}
 */
class ESLintError extends LintError {
	/**
	 * Creates an instance of ESLintError.
	 *
	 * @param {Object} error eslint原生错误对象
	 *
	 * @memberOf ESLintError
	 */
	constructor (error) {
		super({
			// 错误等级默认error，后面会覆盖
			severity: 'error',

			// 行号
			lineNumber: error.line,

			// 列号
			columnNumber: error.column,

			// 错误信息
			// message: error.message,

			// 触发错误的规则
			rule: error.ruleId,

			// 源代码上下文
			// source: error.source,

			// 报错插件
			plugin: 'ESLint',

			// 文档
			doc: docUrl(error.ruleId, error),
		}, error, {
			// 错误等级
			severity: (error.fatal || error.severity === 2) ? 'error' : 'warn',
		});
	}
}

function lookupPluginDocBaseUrl (plugin) {
	if (plugin in pluginDocBaseUrl) {
		return pluginDocBaseUrl[plugin];
	}
	for (const module in require.cache) {
		if (!/^(.+?([\\/]))eslint-plugin-(\w+(?:-\w+)*)\2/.test(module) || (RegExp.$3 in pluginDocBaseUrl)) {
			continue;
		}
		const pluginName = RegExp.$3;
		const pluginDir = RegExp.$1;

		pluginDocBaseUrl[pluginName] = rule => {
			const pkg = require(`${pluginDir}eslint-plugin-${pluginName}/package.json`);
			let repository = pkg.repository;
			repository = repository.url || repository;
			repository = repository.replace(/^(?:git\+)?\w+:\/+(?:.+?@)?(.+?)(?:\/+|\.git)?$/i, 'https://$1');
			pluginDocBaseUrl[pluginName] = rule => `${repository}/blob/HEAD/docs/rules/${rule}.md#readme`;
			return pluginDocBaseUrl[pluginName](rule);
		};
	}
	return pluginDocBaseUrl[plugin];
}

function docUrl (rule, error) {
	if (!rule) {
		return;
	}
	let baseUrl;
	if (/^(.+?)\/(.+)$/.test(rule)) {
		rule = RegExp.$2;
		baseUrl = lookupPluginDocBaseUrl(RegExp.$1);
	} else {
		return `https://${locale === 'zh_CN' ? 'cn.' : ''}eslint.org/docs/rules/${rule}`;
	}
	if (baseUrl) {
		if (typeof baseUrl == 'function') {
			try {
				return baseUrl(rule, error);
			} catch (ex) {
				//
			}
		} else {
			return baseUrl.replace(/(#)$/, '$1' + rule);
		}
	}
}

module.exports = ESLintError;
