'use strict';
const stripAnsi = require('strip-ansi');
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
	stripAnsi(
		gutil.log.lastCall.args[0]
			.replace(/\u001b]50;\w+=.+?\u0007/, '')
	)
		.replace(/\n +\(/g, ' (')
		.replace(/ +/g, ' ')
);
