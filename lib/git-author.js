'use strict';
const BufferStreams = require('bufferstreams');
const spawn = require('child_process').spawn;
const formats = '{"hash":"%H","name":"%aN","email":"%aE","timestamp":%at}';

/**
 * 获取 git log 排除merge, 最后一条
 *
 * @param   {String} [cwd] git 命令运行时的工作目录
 * @returns {Object} 最后一次提交信息，包含作者名、email、提交时间，提交hash
 */
function runGitLog(cwd) {
	return new Promise((resolve, reject) => {
		const args = ['log', '--no-pager', '--no-merges', '--max-count=1', '--format=' + formats];

		const blame = spawn('git', args, {
			cwd,
		});

		blame.stdout.pipe(new BufferStreams((err, data) => {
			if (data) {
				try {
					data = JSON.parse(data);
					resolve(data);
				} catch (ex) {
					reject(ex);
				}
			}
		}));

		blame.on('error', reject);
		blame.on('close', reject);
	});
}

/**
 * 获取环境变量中的提交信息
 *
 * @returns {Object} 当前提交信息，包含作者名、email、提交时间
 */
function getEvnAuthor() {
	const time = process.env.GIT_AUTHOR_DATE;
	const name = process.env.GIT_AUTHOR_NAME;
	const email = process.env.GIT_AUTHOR_EMAIL;
	if (time && name && email) {
		return {
			name: name,
			email: email,
			timestamp: time - 0
		};
	}
}

module.exports = function(cwd) {
	let author = getEvnAuthor();
	if (author) {
		author = Promise.resolve(author);
	} else {
		author = runGitLog(cwd);
	}
	return author;
};
