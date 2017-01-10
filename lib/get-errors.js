'use strict';
const PostcssError = require('./postcss-error');
const EslintError = require('./eslint-error');
const JshintError = require('./jshint-error');
const TslintError = require('./tslint-error');
const JscsError = require('./jscs-error');
const sortError = require('./short-errors');

function getErrors (file, options) {
	var errors = [];
	if (file.postcss) {
		file.postcss.messages.forEach(message => errors.push(new PostcssError(message)));
	}
	if (file.eslint) {
		file.eslint.messages.forEach(message => errors.push(new EslintError(message, file)));
	}
	if (file.tslint) {
		file.tslint.failures.forEach(failure => errors.push(new TslintError(failure)));
	}
	if (file.jscs && !file.jscs.success) {
		file.jscs.errors.getErrorList().forEach(error => errors.push(new JscsError(error)));
	}
	if (file.jshint && !file.jshint.success && !file.jshint.ignored) {
		file.jshint.results.forEach(result => errors.push(new JshintError(result.error)));
	}

	if (errors.length) {
		errors.forEach(function(error) {
			if (!error.fileName) {
				error.fileName = file.path;
			}
		});
		if (options.filter) {
			errors = errors.filter(error => options.filter(error, file));
		}
		if (options.sort) {
			errors = sortError(errors, typeof options.sort === 'function' ? options.sort : null);
		}
	}
	return errors;
}

module.exports = getErrors;
