gulp-reporter
======

[![NPM version](https://img.shields.io/npm/v/gulp-reporter.svg?style=flat-square)](https://www.npmjs.com/package/gulp-reporter)
[![Travis](https://img.shields.io/travis/gucong3000/gulp-reporter.svg?&label=Linux)](https://travis-ci.org/gucong3000/gulp-reporter)
[![AppVeyor](https://img.shields.io/appveyor/ci/gucong3000/gulp-reporter.svg?&label=Windows)](https://ci.appveyor.com/project/gucong3000/gulp-reporter)
[![Coverage Status](https://img.shields.io/coveralls/gucong3000/gulp-reporter.svg)](https://coveralls.io/r/gucong3000/gulp-reporter)

Error reporter for [eslint](https://github.com/adametry/gulp-eslint)/[jscs](https://github.com/jscs-dev/gulp-jscs)/[jshint](https://github.com/spalger/gulp-jshint)/postcss/[tslint](https://github.com/panuhorsmalahti/gulp-tslint)

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

### options.ignore

Type: `Array|String|RegExp|Function`

Default: `/[\.\-]min\.\w+$/`

Glob patterns for paths to ignore. String or array of strings.

### options.browser

Type: `Boolean`

Default: `false`

[Report error messages right in your browser.](http://postcss.github.io/postcss-browser-reporter/screenshot.png)

### options.console

Type: `Boolean|Function`

Default: `true`

Report error messages in [gutil.log()](https://github.com/gulpjs/gulp-util#logmsg) or your function

### options.sort

Type: `Boolean|Function`

Default: `true`

Messages will not be sorted by severity/line/column, [or your function](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).

### options.filter

Type: `Function`

Filter `Error` object by your callback function.

```js
gulp.src('test/fixtures/postcss/test.css')
	.pipe(postcss())
	.pipe(reporter({
		filter: function(err, file) {
			return err.plugin === 'stylelint' && /^src\b/.test(file.relative);
		}
	})
)
```

### options.beep

Type: `Boolean`

Default: `true`

Make your terminal beep if an error has been reported for any file.

### options.fail

Type: `Boolean|Function`

Stop a task/stream if an error has been reported for any file, but wait for all of them to be processed first.

You can use a function to determine stop or not to stop.

```js
gulp.src('test/fixtures/postcss/test.css')
	.pipe(postcss())
	.pipe(reporter({
		fail: function(err, file) {
			return err.plugin === 'stylelint' && /^src\b/.test(file.relative);
		}
	})
)
```
