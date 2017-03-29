'use strict';

const messages = new Map([
	[/^invalid charset: (.+?), expected: (.+?)$/, '错误的文件编码：$1，期望：$2'],
	[/^expected charset: (.+?)$/, '期望的文件编码：$1'],
	[/^character out of latin1 range: (.+?)$/, '超出latin1编码范围的字符：$1'],

	[/^invalid newline: (.+?), expected: (.+?)$/, '错误的缩进尺寸：$1，期望：$2'],

	[/^invalid indent size: (\d+), expected: (\d+)$/, '错误的缩进尺寸：$1，期望：$2'],

	['invalid indent style: found a leading space, expected: tab', '错误的缩进风格：使用了空格，期望：tab'],
	['invalid indent style: found a leading tab, expected: space', '错误的缩进风格：使用了tab，期望：空格'],
	[/^invalid indent style: found (\d+) soft tab\(s\)$/, '错误的缩进风格：发现$1个软缩进'],
	[/^invalid indent style: found (\d+) hard tab\(s\)$/, '错误的缩进风格：发现$1个硬缩进'],

	['expected final newline', '期望结尾换行'],
	['unexpected final newline', '不许结尾换行'],

	[/^invalid line length: (\d+), expected: (\d+)$/, '错误的行长度：$1，期望：$2以内'],

	['trailing whitespace found', '行尾禁用空白'],
]);
module.exports = function(error) {
	for (const [en, cn] of messages) {
		if (en instanceof RegExp) {
			if (en.test(error.message)) {
				error.message = cn.replace(/\$\d+/, key => en[key]);
				return error;
			}
		} else if (error.message === en) {
			error.message = cn;
			return error;
		}
	}
	return error;
};
