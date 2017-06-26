'use strict';
const blame = require('git-blame');

module.exports = function(file) {
	return new Promise((resolve, reject) => {
		const line = [];
		const commit = {};
		blame(file.path, {
			cwd: file.cwd,
			input: file.contents
		}).on('data', function(type, data) {
			if (type === 'line') {
				line.push(data);
			} else if (type === 'commit') {
				commit[data.hash] = data;
			}
		}).on('end', function() {
			const blame = [];
			line.forEach(line => {
				line.commit = commit[line.hash];
				delete line.hash;
				blame[line.finalLine] = line;
			});
			resolve(blame);
		}).on('error', reject);
	});
};
