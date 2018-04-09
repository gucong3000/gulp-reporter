'use strict';
const got = require('got');
const locale = require('./locale');
const ci = require('ci-info');
const googl = require('goo.gl');
const inGFW = require('in-gfw');

// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

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
		return isInGFW.then(inGFW => {
			if (inGFW) {
				return got(`https://api.t.sina.com.cn/short_url/shorten.json?source=3271760578&url_long=${encodeURIComponent(url)}`, {
					json: true,
				}).then(result => {
					return result.body[0].url_short.replace(/^https?/i, 'https');
				});
			} else {
				return googl.shorten(url);
			}
		});
	});
}

module.exports = function (errors) {
	return Promise.all(errors.map(shortDocUrl));
};
