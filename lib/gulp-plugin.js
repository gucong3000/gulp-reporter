'use strict';
const Transform = require('stream').Transform;
const anymatch = require('anymatch');
const gutil = require('gulp-util');
const PostcssError = require('./postcss-error');
const EslintError = require('./eslint-error');
const JshintError = require('./jshint-error');
const TslintError = require('./tslint-error');
const JscsError = require('./jscs-error');
const consoleReporter = require('./console-reporter');
const browserReporter = require('./browser-reporter');
const sortError = require('./short-error');

module.exports = function(options) {
	options = Object.assign({
		ignore: /[\.\-]min\.\w+$/,
		browser: false,
		console: true,
		sort: true,
		beep: true,
		fail: true
	}, options);

	var ignoreMatcher = anymatch(options.ignore);

	var fails = [];

	function transform(file, encoding, done) {

		function isFail(error) {
			if(typeof options.fail === 'function') {
				return options.fail(error, file);
			} else {
				return !error.severity || error.severity === 'error';
			}
		}

		if (ignoreMatcher(file.path)) {
			file.report = {
				ignore: true
			};
			return done(null, file);
		}
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

		if(errors.length) {
			errors.forEach(function(error) {
				if(!error.fileName) {
					error.fileName = file.path;
				}
			});
			if(options.filter) {
				errors = errors.filter(error => options.filter(error, file));
			}
			if(options.sort) {
				errors = sortError(errors, typeof options.sort === 'function' ? options.sort : null);
			}
			file.report = {
				errors
			};
			if(options.console) {
				consoleReporter(file, typeof options.console === 'function' ? options.console : null);
			}
			if(options.browser) {
				browserReporter(file);
			}
			if(errors.some(isFail)) {
				fails.push(file.relative.replace(/\\/g, '/'));
			}
		}

		done(null, file);
	}

	function flush(done) {

		// 流程结束后信息汇总
		process.nextTick(() => {

			// 没有发现错误
			if (!fails.length) {
				return done();
			}
			var message = 'Lint failed for: ' + fails.join(', ');
			fails = [];

			// 发出报警声
			if(options.beep) {
				gutil.beep();
			}
			if(options.fail) {
				this.emit('error', new gutil.PluginError('gulp-reporter', {
					message: message,
					showStack: false
				}));
			} else {
				(typeof options.console === 'function' ? options.console : gutil.log)(message);
			}
			done();
		});
	}

	return new Transform({
		objectMode: true,
		transform,
		flush
	});
};
