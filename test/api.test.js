'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('assert');
const shortDocUrl = require('../lib/short-doc-url');
const sortErrors = require('../lib/sort-errors');

require('./sandbox');

describe('API', () => {
	it('short-doc-url', () => {
		return shortDocUrl([{
			doc: 'http://163.com'
		}]).then(errors => {
			assert.ok(/^https?:\/\/goo.gl\//.test(errors[0].docShort));
		});
	});
	it('sort-errors', () => {
		const result = sortErrors([
			{
				severity: '!',
			},
			{
				severity: 'info',
			},
			{
			},
			{
				severity: 'warn',
			},
			{
				severity: 'error',
			}
		]);

		assert.ok(!result[0].severity);
		assert.equal(result[1].severity, 'error');
		assert.equal(result[2].severity, 'warn');
		assert.equal(result[3].severity, 'info');
		assert.equal(result[4].severity, '!');

	});
});
