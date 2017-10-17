'use strict';

// const { JSDOM } = require('jsdom');
const stringify = require('json-stable-stringify');
const fs = require('fs-extra');
const got = require('got');
const googl = require('goo.gl');
// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey('AIzaSyACqNSi3cybDvDfWMaPyXZEzQ6IeaPehLE');

function shortUrl(url) {
	return googl.shorten(url);
}

function shortUrlCn(url) {
	return got(`http://api.t.sina.com.cn/short_url/shorten.json?source=3271760578&url_long=${url}`, {
		json: true,
	}).then(result => {
		return result.body[0].url_short;
	});
}


// function get(url, selector) {
// 	return JSDOM.fromURL(url, {
// 		referrer: url
// 	}).then(dom => {
// 		return Array.from(dom.window.document.querySelectorAll(selector)).map(a => a.href);
// 	}, console.error);
// }

function updateFile(file, urls, shortUrlFn) {
	file = require.resolve(file);
	let hasChange = false;
	return fs.readJSON(file).then(shorturlCache => (
		// Object.keys(shorturlCache).forEach(url => {
		// 	if (/^http:\/\/(cn.)eslint/i.test(url)) {
		// 		// console.log(url);
		// 		delete shorturlCache[url];
		// 		urls.push('https' + url.slice(4));
		// 		hasChange = true;
		// 	}
		// }),
		Promise.all(urls.map(url => (
			shorturlCache[url] || shortUrlFn(url).then(shortUrl => {
				if (shortUrl) {
					hasChange = true;
					shorturlCache[url] = shortUrl;
				}
			}).catch(console.error)
		))).then(() => (
			hasChange && fs.writeFile(
				file,
				stringify(
					shorturlCache,
					{
						space: '\t'
					}
				),
				'utf8'
			)
		)).then(() => hasChange)
	));
}

const eslintRules = Object.keys(require('eslint/lib/load-rules')());

Promise.all([
	// get('https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties', '.markdown-body h3 a[href^="#"]'),
	// get('https://cn.eslint.org/docs/rules/', '.rule-list a[href]'),
	// get('https://eslint.org/docs/rules/', '.rule-list a[href]'),
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
		`https://cn.eslint.org/docs/rules/${ rule }`
	)),

	// ESLint
	eslintRules.map(rule => (
		`https://eslint.org/docs/rules/${ rule }`
	)),

	// JSCS
	fs.readdir('node_modules/jscs/lib/rules').then(files => (
		files.filter(file => /\.js$/.test(file)).map(rule => (
			rule.replace(/\.\w+$/, '').replace(/-[\w]/g, char => char[1].toUpperCase())
		)).map(rule => (
			`http://jscs.info/rule/${ rule }`
		))
	)),

	// CSSLint
	require('csslint').CSSLint.getRules().map(rule => rule.url).filter(Boolean),

	// TSLint
	fs.readdir('node_modules/tslint/lib/rules').then(files => (
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

	return Promise.all([
		updateFile(
			'../lib/shorturl.json',
			urls,
			shortUrl
		),
		updateFile(
			'../lib/shorturl_cn.json',
			urls,
			shortUrlCn
		),
	]);
}).then(hasChange => {
	if (hasChange.some(Boolean)) {
		require('child_process').spawn(
			'git',
			[
				'--no-pager',
				'diff',
				'--',
				'lib/*.json'
			],
			{
				stdio: 'inherit'
			}
		);
		process.exitCode = 1;
	}
});

process.on('unhandledRejection', error => {
	console.error(error);
	process.exit(1);
});
