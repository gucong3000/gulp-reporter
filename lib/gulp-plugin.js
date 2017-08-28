'use strict';
const through = require('through2');
const gutil = require('gulp-util');
const getErrors = require('./get-errors');
const reporter = require('./reporter');
const ciReporter = require('./ci-reporter');
const getOptions = require('./get-options');

module.exports = function(options) {
	let fails = [];

	options = getOptions(options);

	function transform(file, encoding, done) {
		const report = file.report || (file.report = {});
		options(file).then(options => {
			report.options = options;
			return getErrors(file, options).then(errors => {
				report.errors = errors;
				report.fail = reporter(file, options);

				if (report.fail && options.fail) {
					fails.push(file);
				}

				done(null, file);
			});
		}).catch(error => {
			done(new gutil.PluginError('gulp-reporter', error), file);
		});
	}

	function flush(done) {

		// 没有发现错误
		if (!fails.length) {
			return done();
		}

		const errors = [];

		const message = 'Lint failed for: ' + fails.map(file => {
			errors.push.apply(errors, file.report.errors);
			return file.relative.replace(/\\/g, '/');
		}).join(', ');
		fails = [];


		ciReporter(errors.filter(Boolean))
			.then(() => {}, error => error)
			.then(error => {
				this.emit('error', error || new gutil.PluginError('gulp-reporter', {
					message: message,
					showStack: false,
					showProperties: false,
				}));
				done();
			});
	}

	return through.obj(transform, flush);
};
