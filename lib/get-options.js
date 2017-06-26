'use strict';
const defaultOpts = {
	ignore: /\Wmin\.\w+$/,
	author: getAuthor,
	browser: false,
	console: true,
	sort: true,
	beep: true,
	fail: true
};
const getAuthor = require('./git-author');
function getOptions(file, options) {
	if (typeof options === 'function') {
		options = options(file);
	}
	return Promise.resolve(options).then(options => Object.assign(defaultOpts, options)).then(options => {
		let author = options.author;
		if (typeof author === 'function') {
			author = author(file.cwd);
		}
		return Promise.resolve(author).then(author => {
			options.author = author;
		});
	});
}
module.exports = getOptions;
