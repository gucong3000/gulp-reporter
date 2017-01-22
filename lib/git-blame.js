'use strict';
const BufferStreams = require('bufferstreams');
const spawn = require('child_process').spawn;
const REBLAME = /(?:^|\n)(\w+)(?:\s.+?)?\s+\((?:<(.+?)>|(\S+))\s+(.+?)\s+(\d+)\)/gm;
const parseDate = require('./parse-date');

/**
 * 运行 git blame 命令
 *
 * @param   {Vinyl}   file      要检查blame信息的文件
 * @param   {Boolean} showEmail 是否使用后email代替用户名
 * @returns {Promise} 命令运行结果，Buffer
 */
function runBlame(file, showEmail) {
	return new Promise((resolve, reject) => {
		const args = ['blame', '-l', '-t', '-w', '-C', '-M'];
		if (showEmail) {
			args.push('--show-email');
		}
		if (file.contents) {
			args.push('--contents');
			args.push('-');
		}

		args.push('--');
		args.push(file.path);

		const blame = spawn('git', args, {
			cwd: file.cwd,
		});

		if (file.isBuffer()) {
			blame.stdin.write(file.contents);
			blame.stdin.end();
		} else if (file.isStream()) {
			file.contents.pipe(blame.stdin);
		}

		blame.stdout.pipe(new BufferStreams((err, buf) => {
			if (buf) {
				resolve(buf);
			} else if (err) {
				reject(err);
			}
		}));

		blame.on('error', reject);
		blame.on('close', reject);
	});
}

/**
 * 将git blame 命令运行结果转换为行号作为下标的数组
 *
 * @param {Buffer}   data git blame命令返回的buffer信息
 * @returns {Array}  数组，里面是每行代码的作者信息对象
 */
function getReaslt(data) {
	if (data && data.length) {
		let result = [];
		let match;
		data = data.toString();
		REBLAME.lastIndex = 0;

		while ((match = REBLAME.exec(data))) {
			if (/^0+$/.test(match[1])) {
				continue;
			}
			const lineNumber = +match[5];
			const blame = result[lineNumber] = {
				hash: match[1],
				time: parseDate(match[4]),
			};
			if (match[2]) {
				blame.email = match[2];
			}
			if (match[3]) {
				blame.name = match[3];
			}
		}
		return result;
	}
}

/**
 * 运行 git blame 命令
 *
 * @param   {Vinyl}   file      要检查blame信息的文件
 * @param   {Boolean} showEmail 是否使用后email代替用户名
 * @returns {Promise} 命令运行结果，数组，里面是每行代码的作者信息对象
 */
function getFileBlame(file, showEmail) {
	return runBlame(file, showEmail).then(getReaslt);
}

module.exports = function(file) {
	return Promise.all([getFileBlame(file), getFileBlame(file, true)]).then(blame => {
		return blame[0].map((blameLine, index) => {
			if (blameLine) {
				blameLine = Object.assign(blameLine, blame[1][index]);
			}
			return blameLine;
		});
	});
};
