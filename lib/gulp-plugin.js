'use strict';
const through = require('through2');
const anymatch = require('anymatch');
const gutil = require('gulp-util');
const getErrors = require('./get-errors');
const reporter = require('./reporter');
const getOptions = require('./get-options');

module.exports = function(options) {
	let fails = [];

	options = getOptions(options);

	function transform(file, encoding, done) {
		const report = file.report || (file.report = {});
		options(file).then(options => {
			report.options = options;
			const ignoreMatcher = anymatch(options.ignore);
			if (ignoreMatcher(file.path)) {
				report.ignore = true;
				report.fail = false;
				report.errors = [];
				return done(null, file);
			}

			return getErrors(file, options).then(errors => {
				report.ignore = false;
				report.errors = errors;
				report.fail = reporter(file, options);

				if (report.fail && options.fail) {
					fails.push(file.relative.replace(/\\/g, '/'));
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

		const message = 'Lint failed for: ' + fails.join(', ');
		fails = [];

		this.emit('error', new gutil.PluginError('gulp-reporter', {
			message: message,
			showStack: false,
			showProperties: false,
		}));
		done();
	}

	return through.obj(transform, flush);
};
