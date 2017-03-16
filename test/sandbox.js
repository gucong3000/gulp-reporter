'use strict';
const gutil = require('gulp-util');
const sinon = require('sinon');
const before = require('mocha').before;
const after = require('mocha').after;

const sandbox = sinon.sandbox.create();
const colorsEnabled = gutil.colors.enabled;
before(function () {
	gutil.colors.enabled = false;
	sandbox.stub(gutil, 'log');
});

after(function () {
	gutil.colors.enabled = colorsEnabled;
	sandbox.restore();
});

function errorHandle(error) {
	gutil.log(error);
	if (!process.exitCode) {
		process.exitCode = 1;
	}
}
process.on('unhandledRejection', errorHandle);

process.on('uncaughtException', errorHandle);
