'use strict';
const gitAuthor = require('./git-author');
const toTime = require('to-time');

module.exports = function(options) {
	const authorCache = {};

	function getAuthor(cwd) {
		return authorCache[cwd] || (authorCache[cwd] = gitAuthor(cwd));
	}

	function getOptions(file, ) {
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
						expires = new Date(expires);
					} catch (ex) {
						expires = toTime(expires).seconds();
					}
				}
				if (typeof expires == 'number') {
					options._timestamp = (author && author.timestamp || (Date.now() / 1000)) - expires;
				} else if (expires.getTime) {
					options._timestamp = expires.getTime() / 1000;
				}
			}
			return options;
		});
	}
	return getOptions;
};
