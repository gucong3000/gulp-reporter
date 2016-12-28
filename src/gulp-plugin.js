'use strict';
const Transform = require('stream').Transform;
const gutil = require('gulp-util');
const PostcssError = require('./postcss-error');
const EslintError = require('./eslint-error');
const JshintError = require('./jshint-error');
const TslintError = require('./tslint-error');
const consoleReporter = require('./console-reporter');
const browserReporter = require('./browser-reporter');
const sortError = require('./short-error');

module.exports = function(options) {
	options = Object.assign({
		browser: false,
		console: true,
		sort: true,
		fail: true
	}, options);

	var fails = [];
	function transform(file, encoding, done) {
		file.report = {
			errors: []
		};
		if (file.postcss) {
			file.postcss.messages.forEach(message => file.report.errors.push(new PostcssError(message)));
		}
		if (file.eslint) {
			file.eslint.messages.forEach(message => file.report.errors.push(new EslintError(message, file)));
		}
		if (file.tslint) {
			file.tslint.failures.forEach(failure => file.report.errors.push(new TslintError(failure)));
		}
		if (file.jshint && !file.jshint.success && !file.jshint.ignored) {
			file.jshint.results.forEach(result => file.report.errors.push(new JshintError(result.error)));
		}

		if(options.sort) {
			file.report.errors = sortError(file.report.errors, typeof options.sort === 'function' ? options.sort : null);
		}

		if(file.report.errors.length) {
			file.report.errors.forEach(function(error) {
				if(!error.fileName) {
					error.fileName = file.path;
				}
			});
			if(options.map) {
				file.report.errors = file.report.errors.map(error => options.map(error) || error).filter(Boolean);
			}
			if(options.console) {
				consoleReporter(file);
			}
			if(options.browser) {
				browserReporter(file);
			}
			if(file.report.errors.some(error => !error.severity || error.severity === 'error')) {
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
			gutil.beep();
			if(options.fail) {
				this.emit('error', new gutil.PluginError('gulp-reporter', {
					message: message,
					showStack: false
				}));
			} else {
				gutil.log(message);
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
