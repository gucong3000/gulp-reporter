'use strict';
const blame = require('git-blame');

function parseUser(data) {
	const time = new Date(data.timestamp * 1000);
	return {
		name: data.name,
		mail: data.mail,
		time,
	};
}

function parseCommit(data) {
	return {
		hash: data.hash,
		summary: data.summary,
		author: parseUser(data.committer),
		committer: parseUser(data.committer),
	};
}

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
				commit[data.hash] = parseCommit(data);
			}
			// type can be 'line' or 'commit'
		}).on('end', function() {
			resolve(line.map(line => {
				line.commit = commit[line.hash];
				delete line.hash;
				return line;
			}));
		}).on('error', reject);
	}).then(lines => {
		console.log(lines[0]);
	});
};
