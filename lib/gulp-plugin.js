'use strict';
const Transform = require('stream').Transform;
const anymatch = require('anymatch');
const gutil = require('gulp-util');
const getErrors = require('./get-errors');
const reporter = require('./reporter');
const getOptions = require('./get-options');

require('./postcss-patch.js');

module.exports = function(options) {
	let fails = [];

	function transform(file, encoding, done) {
		const report = file.report || (file.report = {});
		return getOptions(file, options).then(options => {
			const ignoreMatcher = anymatch(options.ignore);
			if (ignoreMatcher(file.path)) {
				report.ignore = true;
				report.errors = [];
				return done(null, file);
			}

			return getErrors(file, options).then(errors => {
				report.errors = errors;

				if (reporter(file, options)) {
					fails.push(file.relative.replace(/\\/g, '/'));
				}

				done(null, file);
			});
		}).catch(done);
	}

	function flush(done) {

		// 没有发现错误
		if (!fails.length) {
			return done();
		}
		const message = 'Lint failed for: ' + fails.join(', ');
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
	}

	return new Transform({
		objectMode: true,
		transform,
		flush
	});
};
