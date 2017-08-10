gulp-reporter
======

[![NPM version](https://img.shields.io/npm/v/gulp-reporter.svg?style=flat-square)](https://www.npmjs.com/package/gulp-reporter)
[![Travis](https://img.shields.io/travis/gucong3000/gulp-reporter.svg?&label=Linux)](https://travis-ci.org/gucong3000/gulp-reporter)
[![AppVeyor](https://img.shields.io/appveyor/ci/gucong3000/gulp-reporter.svg?&label=Windows)](https://ci.appveyor.com/project/gucong3000/gulp-reporter)
[![Coverage Status](https://img.shields.io/coveralls/gucong3000/gulp-reporter.svg)](https://coveralls.io/r/gucong3000/gulp-reporter)

Error report for:
[CSSLint](https://github.com/lazd/gulp-csslint)
[EditorConfig](https://github.com/jedmao/eclint)
[ESLint](https://github.com/adametry/gulp-eslint)
[HTMLHint](https://github.com/bezoerb/gulp-htmlhint)
[JSCS](https://github.com/jscs-dev/gulp-jscs)
[JSHint](https://github.com/spalger/gulp-jshint)
[PostCSS](https://github.com/StartPolymer/gulp-html-postcss)
[Standard](https://github.com/emgeee/gulp-standard)
[TSLint](https://github.com/panuhorsmalahti/gulp-tslint)
[XO](https://github.com/sindresorhus/gulp-xo)

Analyzing blame of the error, only fail for errors that belong to current GIT user.

## Install

```bash
npm install gulp-eslint
```

## Usage

```js
gulp.src('test/fixtures/eslint/invalid.js')
	.pipe(eslint())
	.pipe(reporter(options));
```

![demo](demo.png)

## API

```js
reporter(options)
```
or

```js
reporter((file) => options)
```

### options.browser

Type: `boolean`

Default: `false`

[Report error messages right in your browser.](http://postcss.github.io/postcss-browser-reporter/screenshot.png)

### options.output

Type: `boolean|function|WritableStream`

Default: `true`

Report error messages in [gutil.log()](https://github.com/gulpjs/gulp-util#logmsg) or your `function|WritableStream`

### options.sort

Type: `boolean|function`

Default: `true`

Messages will be sorted by fileName/severity/line/column, [or your function](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).


### options.author
Type: `{name?: string|RegExp, email?: string|RegExp}`

Default: Read from GIT pre-commit environment and fallbacks with GIT commad `git log --max-count=1 --no-merges`

Do not fail for errors that not belong to specified author.

> Do not work when `options.blame` set to `false`

### options.expires

Type: `string` for [time periods](https://www.npmjs.com/package/to-time#usage), `number` of unix timestamp, `Date`

Do not fail for old errors that create early specified time.

> Do not work when `options.blame` set to `false`

### options.maxLineLength

Type: `number`

Default: 512

Hide each error in lines that length greater than this threshold.

### options.fail

Type: `boolean|function`

Default: `true`

Stop a task/stream if an error has been reported for any file, but wait for all of them to be processed first.

### options.blame

Type: `boolean`

Default: `true`

Enable or disable [git-blame](https://git-scm.com/docs/git-blame) related features (options.author, options.expires).

## Related

- [eclint](https://github.com/jedmao/eclint)
- [gulp-csslint](https://github.com/lazd/gulp-csslint)
- [gulp-eslint](https://github.com/adametry/gulp-eslint)
- [gulp-html-postcss](https://github.com/StartPolymer/gulp-html-postcss)
- [gulp-htmlhint](https://github.com/bezoerb/gulp-htmlhint)
- [gulp-jscs](https://github.com/jscs-dev/gulp-jscs)
- [gulp-jshint](https://github.com/spalger/gulp-jshint)
- [gulp-standard](https://github.com/emgeee/gulp-standard)
- [gulp-tslint](https://github.com/panuhorsmalahti/gulp-tslint)
- [gulp-xo](https://github.com/sindresorhus/gulp-xo)
