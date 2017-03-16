'use strict';
const Transform = require('stream').Transform;
const anymatch = require('anymatch');
const gutil = require('gulp-util');
const getErrors = require('./get-errors');
const reporter = require('./reporter');
const filterAuthor = require('./filter-author');

module.exports = function(options) {
	options = Object.assign({
		ignore: /[\.\-]min\.\w+$/,
		filter: [filterAuthor()],
		browser: false,
		console: true,
		sort: true,
		beep: true,
		fail: true
	}, options);

	if (options.filter && !Array.isArray(options.filter)) {
		options.filter = [options.filter];
	}

	const ignoreMatcher = anymatch(options.ignore);

	let fails = [];

	function transform(file, encoding, done) {

		const report = file.report || (file.report = {});

		if (ignoreMatcher(file.path)) {
			report.ignore = true;
			report.errors = [];
			return done(null, file);
		}

		getErrors(file, options).then(errors => {
			report.errors = errors;
			if (reporter(file, options)) {
				fails.push(file.relative.replace(/\\/g, '/'));
			}

			done(null, file);
		}).catch(done);
	}

	function flush(done) {

		// 流程结束后信息汇总

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

module.exports.filterByAuthor = require('./filter-author');
