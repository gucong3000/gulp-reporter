gulp-reporter
======

[![NPM version](https://img.shields.io/npm/v/gulp-reporter.svg?style=flat-square)](https://www.npmjs.com/package/gulp-reporter)
[![Travis](https://img.shields.io/travis/gucong3000/gulp-reporter.svg?&label=Linux)](https://travis-ci.org/gucong3000/gulp-reporter)
[![AppVeyor](https://img.shields.io/appveyor/ci/gucong3000/gulp-reporter.svg?&label=Windows)](https://ci.appveyor.com/project/gucong3000/gulp-reporter)
[![Coverage Status](https://img.shields.io/coveralls/gucong3000/gulp-reporter.svg)](https://coveralls.io/r/gucong3000/gulp-reporter)

Error report localization for:
[CSSLint](https://github.com/lazd/gulp-csslint)
[EditorConfig](https://github.com/jedmao/eclint)
[ESLint](https://github.com/adametry/gulp-eslint)
[HTMLHint](https://github.com/bezoerb/gulp-htmlhint)
[JSCS](https://github.com/jscs-dev/gulp-jscs)
[JSHint](https://github.com/spalger/gulp-jshint)
[PostCSS](https://github.com/postcss/gulp-postcss)
[TSLint](https://github.com/panuhorsmalahti/gulp-tslint)

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

![demo](demo.gif)

## API

```js
reporter(options)
```
or

```js
reporter(file => {
	return options
})
```

### options.ignore

Type: `Array|string|RegExp|function`

Default: `/\Wmin\.\w+$/`

Glob patterns for paths to ignore. String or array of strings.

### options.browser

Type: `boolean`

Default: `false`

[Report error messages right in your browser.](http://postcss.github.io/postcss-browser-reporter/screenshot.png)

### options.console

Type: `boolean|function`

Default: `true`

Report error messages in [gutil.log()](https://github.com/gulpjs/gulp-util#logmsg) or your function

### options.sort

Type: `boolean|function`

Default: `true`

Messages will not be sorted by severity/line/column, [or your function](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).


### reporter.author
Type: `{name?: string, email?: string}`

Default: Read from GIT pre-commit environment and fallbacks with GIT commad `git log --max-count=1 --no-merges`

Demote each error that is not belong to specified author to a warning.

### reporter.expires

Type: `string` for [time periods](https://www.npmjs.com/package/to-time#usage), `number` of unix timestamp, `Date`

Demote each error that created before the specified time to a warning

### options.fail

Type: `boolean|function`

Default: `true`

Stop a task/stream if an error has been reported for any file, but wait for all of them to be processed first.

You can use a function to determine stop or not to stop.

```js
gulp.src('src/test.css')
	.pipe(postcss([stylelint]))
	.pipe(reporter({
		fail: function(err, file) {
			return err.plugin === 'stylelint' && /^src\b/.test(file.relative);
		}
	})
)
```
