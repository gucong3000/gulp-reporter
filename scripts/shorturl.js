'use strict';
const promisify = require('util').promisify;
if (!promisify) {
	process.exit(0);
}
// const { JSDOM } = require('jsdom');
const stringify = require('json-stable-stringify');
const readdir = promisify(require('fs').readdir);
const shorturlCache = require('../lib/shorturl.json');
const got = require('got');
const googl = require('goo.gl');
const fs = require('fs');
// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

function shortUrl(url) {
	return googl.shorten(url).then(shortUrl => {
		return shortUrl;
	}).catch(() => {
		return;
	});
}

// function get(url, selector) {
// 	return JSDOM.fromURL(url, {
// 		referrer: url
// 	}).then(dom => {
// 		return Array.from(dom.window.document.querySelectorAll(selector)).map(a => a.href);
// 	}, console.error);
// }

let log = false;

const eslintRules = Object.keys(require('eslint/lib/load-rules')());

Promise.all([
	// get('https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties', '.markdown-body h3 a[href^="#"]'),
	// get('http://cn.eslint.org/docs/rules/', '.rule-list a[href]'),
	// get('http://eslint.org/docs/rules/', '.rule-list a[href]'),
	// get('https://stylelint.io/user-guide/rules/', 'h1 ~ ul a[href$="/"]'),
	// get('https://palantir.github.io/tslint/rules/', '.rules-list a[href]').then(urls => (
	// 	urls.map(url => (
	// 		url.replace(/\/*$/, '/')
	// 	))
	// )),
	// get('https://github.com/yaniswang/HTMLHint/wiki/Rules', '.markdown-body ul a[href*="HTMLHint"]'),
	// get('https://github.com/CSSLint/csslint/wiki/Rules', '.markdown-body ul a[href^="/CSSLint"]'),
	// get('http://jscs.info/rules', '.rule-list a[href]'),

	// ESLint (zh-CN)
	eslintRules.map(rule => (
		`http://cn.eslint.org/docs/rules/${ rule }`
	)),

	// ESLint
	eslintRules.map(rule => (
		`http://eslint.org/docs/rules/${ rule }`
	)),

	// JSCS
	readdir('node_modules/jscs/lib/rules').then(files => (
		files.filter(file => /\.js$/.test(file)).map(rule => (
			rule.replace(/\.\w+$/, '').replace(/-[\w]/g, char => char[1].toUpperCase())
		)).map(rule => (
			`http://jscs.info/rule/${ rule }`
		))
	)),

	// CSSLint
	require('csslint').CSSLint.getRules().map(rule => rule.url).filter(Boolean),

	// TSLint
	readdir('node_modules/tslint/lib/rules').then(files => (
		files.filter(file => /Rule\.js$/.test(file)).map(rule => (
			rule.replace(/Rule\.\w+$/, '').replace(/[A-Z]/g, char => '-' + char.toLowerCase())
		)).map(rule => (
			`https://palantir.github.io/tslint/rules/${ rule }/`
		))
	)),

	// stylelint
	Object.keys(require('stylelint/lib/rules')).map(rule => (
		`https://stylelint.io/user-guide/rules/${ rule }/`
	)),

	// HTMLHint
	Object.keys(require('htmlhint').HTMLHint.rules).map(rule => (
		`https://github.com/yaniswang/HTMLHint/wiki/${ rule }`
	)),
]).then(urls => {
	urls = [].concat.apply([], urls).filter(Boolean).map(url => url.toLowerCase());

	// fs.writeFile('new.log', stringify(urls, {
	// 	space: '\t'
	// }), 'utf8', () => {
	// });
	// fs.writeFile('old.log', stringify(Object.keys(shorturlCache), {
	// 	space: '\t'
	// }), 'utf8', () => {
	// });

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
		if (log) {
			process.exitCode = -1;
			const json = stringify(shorturlCache, {
				space: '\t'
			});
			fs.writeFile(require.resolve('../lib/shorturl.json'), json, 'utf8', () => {
				console.log(json);
			});
			const shorturlcn = {};
			Promise.all(Object.keys(shorturlCache).map( url => (
				got(`http://api.t.sina.com.cn/short_url/shorten.json?source=3271760578&url_long=${url}`, {
					json: true,
				}).then(result => {
					shorturlcn[url] = result.body[0].url_short;
				})
			))).then(() => {
				const json = stringify(shorturlcn, {
					space: '\t'
				});
				fs.writeFile(require.resolve('../lib/shorturl_cn.json'), json, 'utf8', () => {
				});
			});
		}
	});
});
