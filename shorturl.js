'use strict';
const { JSDOM } = require('jsdom');
const stringify = require('json-stable-stringify');
const readdir = require('util').promisify(require('fs').readdir);
const shorturlCache = require('./lib/shorturl.json');
const googl = require('goo.gl');
// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

const eslintRules = readdir('node_modules/eslint/lib/rules').then(files => files.filter(file => /\.js$/.test(file)).map(rule => rule.replace(/\.\w+$/, '')));

function shortUrl(url) {
	return googl.shorten(url).then(shortUrl => {
		return shortUrl;
	}).catch(() => {
		return;
	});
}

function get(url, selector) {
	return JSDOM.fromURL(url).then(dom => {
		return Array.from(dom.window.document.querySelectorAll(selector)).map(a => a.href);
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
	Object.keys(require('stylelint/lib/rules')).map(rule => 'https://stylelint.io/user-guide/rules/' + rule + '/'),
	eslintRules.then(rules => rules.map(rule => 'http://cn.eslint.org/docs/rules/' + rule)),
	eslintRules.then(rules => rules.map(rule => 'http://eslint.org/docs/rules/' + rule)),
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
		const fs = require('fs');
		if (log) {
			const json = stringify(shorturlCache, {
				space: '\t'
			});
			fs.writeFile(require.resolve('./lib/shorturl.json'), json, 'utf8', () => {
				console.log(json);
			});
		}
	});
});
