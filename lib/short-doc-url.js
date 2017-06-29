'use strict';
const googl = require('goo.gl');
const shorturlCache = require('./shorturl.json');
// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

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
	return googl.shorten(url).then(shortUrl => {
		shorturlCache[url] = shortUrl;
		return shortUrl;
	}).catch(() => {
		return;
	});
}

module.exports = function(errors) {
	return Promise.all(errors.map(shortDocUrl));
};
