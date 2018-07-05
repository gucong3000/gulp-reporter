'use strict';
const stripAnsi = require('strip-ansi');
const log = require('fancy-log');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

beforeEach(() => {
	sandbox.stub(log, 'warn');
});

afterEach(() => {
	sandbox.restore();
});

function errorHandle (error) {
	log(error);
	if (!process.exitCode) {
		process.exitCode = 1;
	}
}

process.on('unhandledRejection', errorHandle);
process.on('uncaughtException', errorHandle);

exports.getLog = () => (
	stripAnsi(
		/* eslint-disable-next-line no-control-regex */
		log.warn.lastCall.args[0].replace(/\u001b]50;\w+=.+?\u0007/, '').replace(/([\u2000-\u3000])\ufe0f?\s+/g, '$1\u{fe0f} ')
	)
		.replace(/\n +\(/g, ' (')
		.replace(/ +/g, ' ')
);

exports.thenable = (stream) => {
	return new Promise((resolve, reject) => {
		const rst = [];
		stream
			.on('data', (data) => {
				rst.push(data);
			})
			.on('end', () => {
				resolve(rst);
			})
			.on('error', reject);
	});
};

exports.gotError = (stream) => {
	return new Promise((resolve, reject) => {
		const rst = [];
		stream
			.on('data', (data) => {
				rst.push(data);
			})
			.on('end', () => {
				reject(rst);
			})
			.on('error', resolve);
	});
};
