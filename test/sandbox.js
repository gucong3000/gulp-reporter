'use strict';
const gutil = require('gulp-util');
const sinon = require('sinon');
const before = require('mocha').before;
const after = require('mocha').after;

var sandbox = sinon.sandbox.create();
var colorsEnabled = gutil.colors.enabled;
before(function () {
	gutil.colors.enabled = false;
	sandbox.stub(gutil, 'log');
});

after(function () {
	gutil.colors.enabled = colorsEnabled;
	sandbox.restore();
});
