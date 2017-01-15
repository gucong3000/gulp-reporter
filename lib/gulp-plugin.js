'use strict';
const Transform = require('stream').Transform;
const anymatch = require('anymatch');
const gutil = require('gulp-util');
const getErrors = require('./get-errors');
const reporter = require('./reporter');

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

		var report = file.report || (file.report = {});

		if (ignoreMatcher(file.path)) {
			report.ignore = true;
			return done(null, file);
		}

		report.errors = getErrors(file, options);

		if (reporter(file, options)) {
			fails.push(file.relative.replace(/\\/g, '/'));
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
			if (options.beep) {
				gutil.beep();
			}
			if (options.fail) {
				this.emit('error', new gutil.PluginError('gulp-reporter', {
					message: message,
					showStack: false,
					showProperties: false,
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
