'use strict';
const BufferStreams = require('bufferstreams');
const spawn = require('child_process').spawn;

/**
 * 运行 git blame 命令
 *
 * @param   {Vinyl}   file      要检查blame信息的文件
 * @param   {Boolean} showEmail 是否使用后email代替用户名
 * @returns {Promise} 命令运行结果，Buffer
 */
function runBlame(file) {
	return new Promise((resolve, reject) => {
		const args = [
			'--no-pager',
			'blame',
			'-w',
			'-C',
			'-M',
			'-p'
		];
		if (file.contents) {
			args.push('--contents');
			args.push('-');
		}

		args.push('--');
		args.push(file.path);

		const blame = spawn('git', args, {
			cwd: file.cwd,
		});
		let result;

		blame.stdin.on('error', reject);

		if (file.isBuffer()) {
			blame.stdin.write(file.contents);
			blame.stdin.end();
		} else if (file.isStream()) {
			file.contents.pipe(blame.stdin);
		}

		blame.stdout.pipe(new BufferStreams((err, buf) => {
			if (buf) {
				result = buf;
			} else if (err) {
				reject(err);
			}
		}));

		blame.on('error', reject);
		blame.on('exit', code => {
			if (code) {
				reject(code);
			} else {
				resolve(result);
			}
		});
	});
}

function parsePerson(data, result) {
	data.replace(/^\w+-(\w+) (.*)$/gm, (s, key, value) => {
		if ('mail' === key) {
			value = value.replace(/^<(.*)>$/, '$1');
		} else if ('time' === key) {
			value = value - 0;
		}
		result[key] = value;
		return '';
	});
	return result;
}

function parseRev(data, result) {
	data.replace(/^(\w+) (.*)(\n(?:\1-\w+ .*\n)+)/gm, (s, role, name, props) => {
		result[role] = parsePerson(props, {
			name
		});
		return '';
	}).replace(/^previous (\w+) (.*)$/gm, (s, hash, filename) => {
		result.previous = {
			hash,
			filename,
		};
		return '';
	}).replace(/^(\S+) (.*)$/gm, (s, key, value) => {
		result[key] = value;
	});
	return result;
}

function parseBlame(data) {
	const revCache = {};
	const result = [];
	data.replace(/^(\w{40,}) (\d+) (\d+)(?: \d+)*\n((?:\S*.*\n)*?)\t(.*)$/gm, (s, hash, originalLine, finalLine, rev, content) => {
		originalLine = originalLine - 0;
		finalLine = finalLine - 0;
		if (rev) {
			rev = parseRev(rev, {
				hash
			});
			revCache[hash] = rev;
		} else {
			rev = revCache[hash];
		}
		result[finalLine] = {
			originalLine: originalLine,
			finalLine,
			content,
			rev
		};
	});
	return result;
}


/**
 * 将git blame 命令运行结果转换为行号作为下标的数组
 *
 * @param {Buffer}   data git blame命令返回的buffer信息
 * @returns {Array}  数组，里面是每行代码的作者信息对象
 */
function parseReaslt(data) {
	if (data && data.length) {
		data = data.toString();
		if (data) {
			return parseBlame(data.toString());
		}
	}
}

/**
 * 运行 git blame 命令
 *
 * @param   {Vinyl}   file      要检查blame信息的文件
 * @param   {Boolean} showEmail 是否使用后email代替用户名
 * @returns {Promise} 命令运行结果，数组，里面是每行代码的作者信息对象
 */
function getFileBlame(file) {
	return runBlame(file).then(parseReaslt);
}

module.exports = getFileBlame;
