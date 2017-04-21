'use strict';
/* global navigator */
if (typeof navigator === 'object') {
	module.exports = navigator.language.replace(/-/g, '_');
} else {
	const osLocale = require('os-locale');
	module.exports = osLocale.sync();
}
