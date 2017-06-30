'use strict';
const locale = require('./locale');
const request = require('request-promise-native');
const shorturlCache = require(locale === 'zh_CN' ? './shorturl_cn.json' : './shorturl.json');

function shortDocUrl(error) {
	if (!error.doc) {
		return error;
	}
	return shortUrl(error.doc).then(shortUrl => {
		if (shortUrl) {
			error.docShort = shortUrl;
		}
		return error;
	});
}

function shortUrl(url) {
	url = url.toLowerCase();
	if (shorturlCache[url]) {
		return Promise.resolve(shorturlCache[url]);
	}

	return request(`http://api.t.sina.com.cn/short_url/shorten.json?source=3271760578&url_long=${url}`).then(json => {
		return JSON.parse(json)[0].url_short;
	}).catch(() => {
		return;
	});
}

module.exports = function(errors) {
	return Promise.all(errors.map(shortDocUrl));
};
