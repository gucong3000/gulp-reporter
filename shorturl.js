'use strict';
const jsdom = require('jsdom');
const shorturlCache = require('./lib/shorturl.json');

const googl = require('goo.gl');
// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

function shortUrl(url) {
	return googl.shorten(url).then(shortUrl => {
		return shortUrl;
	}).catch(() => {
		return;
	});
}

function get(url, selector) {
	return new Promise((resolve, reject) => {
		jsdom.env({
			url: url,
			done: function (error, window) {
				if (error) {
					return reject(error);
				}
				resolve(Array.from(window.document.querySelectorAll(selector)).map(a => a.href));
			}
		});
	});
}

let log = false;

Promise.all([
	get('http://cn.eslint.org/docs/rules/', '.rule-list a[href]'),
	get('http://eslint.org/docs/rules/', '.rule-list a[href]'),
	get('http://jscs.info/rules', '.rule-list a[href]'),
	get('https://github.com/CSSLint/csslint/wiki/Rules', '.markdown-body ul a[href^="/CSSLint"]'),
	get('https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties', '.markdown-body h3 a[href^="#"]'),
	get('https://github.com/yaniswang/HTMLHint/wiki/Rules', '.markdown-body ul a[href*="HTMLHint"]'),
	get('https://palantir.github.io/tslint/rules/', '.rules-list a[href]'),
	get('https://stylelint.io/user-guide/rules/', 'h1 ~ ul a[href$="/"]'),
]).then(urls => {
	urls = [].concat.apply([], urls).map(url => url.toLowerCase());
	Promise.all(urls.map(url => {
		if (shorturlCache[url]) {
			return;
		}
		return shortUrl(url).then(shortUrl => {
			if (shortUrl) {
				log = true;
				shorturlCache[url] = shortUrl;
			}
		});
	})).then(() => {
		const json = JSON.stringify(shorturlCache, 0, '\t');
		const fs = require('fs');
		if (log) {
			fs.writeFile(require.resolve('./lib/shorturl.json'), json, 'utf8', () => {
				console.log(json);
			});
		}
	});
});
