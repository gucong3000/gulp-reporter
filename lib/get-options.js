'use strict';
const gitAuthor = require('./git-author');
const toTime = require('to-time');

function unixTimestamp(now) {
	return Math.floor((now || Date.now()) / 1000);
}

module.exports = function(options) {
	const authorCache = {};

	function getAuthor(cwd) {
		return authorCache[cwd] || (authorCache[cwd] = gitAuthor(cwd));
	}

	function getOptions(file) {
		if (typeof options === 'function') {
			options = options(file);
		}
		return Promise.all([options, getAuthor(file.cwd)]).then(([options, author]) => {
			options = Object.assign({
				ignore: /\Wmin\.\w+$/,
				author: author,
				browser: false,
				console: true,
				fail: true,
				sort: true,
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
					options._timestamp = (author && author.timestamp || unixTimestamp()) - expires;
				} else if (expires.getTime) {
					expires = expires.getTime();
					if (isNaN(expires)) {
						throw new TypeError('`options.expires` must be valid `Date`.');
					}
					options._timestamp = unixTimestamp(expires);
				} else {
					throw new TypeError('`options.expires` must be `Number`, `Date` or `string`.');
				}
			}

			return options;
		});
	}
	return getOptions;
};
