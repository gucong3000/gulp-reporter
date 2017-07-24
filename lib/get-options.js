'use strict';
const gitAuthor = require('./git-author');
const toTime = require('to-time');
const termSize = require('term-size');
const isCI = require('is-ci');

function unixTimestamp(now) {
	return Math.floor((now || Date.now()) / 1000);
}

module.exports = function(options) {
	const authorCache = {};
	const termColumns = isCI ?
		160 :
		/* istanbul ignore next */
		Math.max(termSize().columns, 80);

	function getAuthor(cwd) {
		return authorCache[cwd] || (authorCache[cwd] = gitAuthor(cwd));
	}

	function getOptions(file) {
		if (typeof options === 'function') {
			options = options(file);
		}
		return Promise.all([options, getAuthor(file.cwd)]).then(([options, author]) => {
			options = Object.assign({
				maxLineLength: 512,
				browser: false,
				console: true,
				fail: true,
				sort: true,
				author,
			}, options);

			if (typeof options.author === 'string') {
				if (/@/.test(options.author)) {
					options.author = {
						email: options.author
					};
				} else {
					options.author = {
						name: options.author
					};
				}
			}

			let expires = options.expires;

			if (expires) {
				if (typeof expires === 'string') {
					try {
						expires = toTime(expires).seconds();
					} catch (ex) {
						expires = new Date(expires);
					}
				}
				if (typeof expires == 'number') {
					if (expires <= 0 || isNaN(expires)) {
						throw new TypeError('`options.expires` must be greater than 0.');
					}
					options._expiresTime = (author && author.time || unixTimestamp()) - expires;
				} else if (expires.getTime) {
					expires = expires.getTime();
					if (isNaN(expires)) {
						throw new TypeError('`options.expires` must be valid `Date`.');
					}
					options._expiresTime = unixTimestamp(expires);
				} else {
					throw new TypeError('`options.expires` must be `Number`, `Date` or `string`.');
				}
			}

			options._termColumns = termColumns;
			return options;
		});
	}
	return getOptions;
};
