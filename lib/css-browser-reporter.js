'use strict';
/**
 * 以css文件格式汇报错误信息
 *
 * @param {Array}    errors <LintError> 错误对象数组
 * @param {String}   [uri] 文件的uri信息
 * @returns {String} css片段
 */
function cssBrowserReporter(errors, uri) {

	const warnIcon = encodeURIComponent(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="48px" height="48px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve"><path fill="#A82734" id="warning-4-icon" d="M228.55,134.812h54.9v166.5h-54.9V134.812z M256,385.188c-16.362,0-29.626-13.264-29.626-29.625c0-16.362,13.264-29.627,29.626-29.627c16.361,0,29.625,13.265,29.625,29.627C285.625,371.924,272.361,385.188,256,385.188z M256,90c91.742,0,166,74.245,166,166c0,91.741-74.245,166-166,166c-91.742,0-166-74.245-166-166C90,164.259,164.245,90,256,90z M256,50C142.229,50,50,142.229,50,256s92.229,206,206,206s206-92.229,206-206S369.771,50,256,50z"/>
</svg>`);
	errors = errors.map(error => {
		let pos;
		if (error.lineNumber && error.columnNumber) {
			pos = `[${ error.lineNumber }:${ error.columnNumber }] `;
		} else {
			pos = '';
		}
		const subMsg = [error.plugin];
		if (error.rule) {
			subMsg.push(error.rule);
		}
		return `${ pos }${ error.message } (${ subMsg.join(' ') })`.replace(/"/g, '\\"');
	});
	if (uri) {
		errors.unshift(uri);
	}
	const styles = {
		'display': 'block',
		'position': 'sticky',

		'margin': '1em',
		'font-size': '.9em',
		'padding': '1.5em 1em 1.5em 4.5em',

		/* padding + background image padding */

		/* background */
		'color': 'white',
		'background-color': '#df4f5e',
		'background': `url("data:image/svg+xml;charset=utf-8,${ warnIcon }") .5em 1.5em no-repeat, #DF4F5E linear-gradient(#DF4F5E, #CE3741)`,

		/* sugar */
		'border': '1px solid #c64f4b',
		'border-radius': '3px',
		'box-shadow': 'inset 0 1px 0 #eb8a93, 0 0 .3em rgba(0,0,0, .5)',

		/* nice font */
		'white-space': 'pre-wrap',
		'font-family': 'Menlo, Monaco, monospace',
		'text-shadow': '0 1px #a82734',
		'content': `"${ errors.join('\\00000a') }"`
	};
	let css = '\nhtml::before {\n';
	for (const key in styles) {
		css += `\t${ key }: ${ styles[key] };\n`;
	}
	return css + '}\n';
}

module.exports = cssBrowserReporter;
