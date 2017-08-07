'use strict';
const got = require('got');
const locale = require('./locale');
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

	return got(`http://api.t.sina.com.cn/short_url/shorten.json?source=3271760578&url_long=${url}`, {
		json: true,
	}).then(result => {
		return result.body[0].url_short;
	}).catch(() => {
		return;
	});
}

module.exports = function(errors) {
	return Promise.all(errors.map(shortDocUrl));
};
