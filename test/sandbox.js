'use strict';
const gutil = require('gulp-util');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

before(() => {
	sandbox.stub(gutil, 'log');
});

after(() => {
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

exports.getLog = () => (
	gutil.colors.stripColor(gutil.log.lastCall.args[0]).replace(/ +/g, ' ').replace(/\n \(/g, ' (')
);
