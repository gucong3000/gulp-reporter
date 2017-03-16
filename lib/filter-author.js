'use strict';
const getAuthor = require('./git-author');

/**
 * 创建一个利用git作者信息过滤错误的过滤器函数
 *
 * @param {Object} [author] 作者信息，对象，至少包含email，或者name，email优先
 * @returns {Function} 过滤器函数
 */
function filterAuthor(author) {
	const authorCache = new Map();

	/**
	 * 获取作者信息，当author存在时author优先，否则缓存内结果优先，否则使用
	 *
	 * @param {String} [cwd] git仓库所在目录，默认当前进程
	 * @returns {Promise} 作者信息
	 */
	function getDirAuthor(cwd) {
		if (author) {
			return author;
		} else if (!authorCache.has(cwd)) {
			authorCache.set(cwd, getAuthor(cwd));
		}
		return authorCache.get(cwd);
	}

	if (author) {
		author = Promise.resolve(author);
	}

	/**
	 * 过滤错误信息，将明确为其他作者所写的代码的错误，错误等级标记为警告
	 *
	 * @param {Array}  errors 已有的错误对象
	 * @param {Vinyl}  file   需要检查的文件
	 * @returns {Promise}     空的，啥都没有
	 */
	function filter(errors, file) {
		return getDirAuthor(file.cwd).then(author => {
			if (!author) {
				return;
			}
			if (author.email) {
				errors.forEach(error => {
					if (error.authorEmail && error.authorEmail !== author.email) {
						downError(error);
					}
				});
			} else if (author.name) {
				errors.forEach(error => {
					if (error.authorName && error.authorName !== author.name) {
						downError(error);
					}
				});
			}
		}).catch(() => {
		});
	}
	return filter;
}

function downError(error) {
	if (!/^0+$/.test(error.commitHash)) {
		error.severity = 'warn';
	}
}

module.exports = filterAuthor;
