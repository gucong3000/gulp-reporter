'use strict';
const googl = require('goo.gl');
const shorturlCache = require('./shorturl.json');
// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

function shorturl(error) {
	if (!error.doc) {
		return error;
	}
	if (shorturlCache[error.doc]) {
		error.doc = shorturlCache[error.doc];
		return error;
	}
	return googl.shorten(error.doc).then(shortUrl => {
		shorturlCache[error.doc] = shortUrl;
		error.doc = shortUrl;
	}).catch(() => {
		// console.error(err.message);
	}).then(() => {
		return error;
	});
}

module.exports = function(errors) {
	return Promise.all(errors.map(shorturl));
};

// Array.from(document.querySelectorAll(".repository-content h2~ul li a[href]")).map(a => a.href)
