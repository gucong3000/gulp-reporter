'use strict';
const got = require('got');
const locale = require('./locale');
const ci = require('ci-info');
const inGFW = require('in-gfw');

const isInGFW = ci.isCI && ci.name ? Promise.resolve(locale === 'zh_CN') : inGFW.os();

const shorturlCache = isInGFW.then(inGFW => {
	return require(inGFW ? './shorturl_cn.json' : './shorturl.json');
});

function shortDocUrl (error) {
	if (!error.doc) {
		return error;
	}
	return shortUrl(error.doc).catch(ex => {
		//
	}).then(shortUrl => {
		if (shortUrl) {
			error.docShort = shortUrl;
		}
		return error;
	});
}

function shortUrl (url) {
	return shorturlCache.then(shorturlCache => {
		const urlLowerCase = url.toLowerCase();
		if (shorturlCache[urlLowerCase]) {
			return shorturlCache[urlLowerCase];
		}
		return isInGFW.then(inGFW => (
			inGFW
				? got(`https://api.t.sina.com.cn/short_url/shorten.json?source=3271760578&url_long=${encodeURIComponent(url)}`, {
					json: true,
				}).then(result => (
					result.body[0].url_short.replace(/^https?/i, 'https')
				))
				: got.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE', {
					json: true,
					body: {
						'longUrl': url,
					},
				}).then(result =>
					result.body.id
				)
		));
	});
}

module.exports = function (errors) {
	return Promise.all(errors.map(shortDocUrl));
};
