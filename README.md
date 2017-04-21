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

### options.ignore

Type: `Array|string|RegExp|function`

Default: `/[\.\-]min\.\w+$/`

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

### options.filter

Type: `Array`
Default: `[reporter.filterByAuthor()]`

Filter `Error` object by your callback functions. support Async function

The default function will check the GIT author of the code that is in errors, and adjusts the error level to 'warn' if this is not related to the current author

```js
gulp.src('test/fixtures/postcss/test.css')
	.pipe(postcss())
	.pipe(reporter({
		filter: async function (errs, file){
			await readFile(file.path);
			return errs.filter(err => err.plugin === 'stylelint');
		}
	})
)
```

### options.beep

Type: `boolean`

Default: `true`

Make your terminal beep if an error has been reported for any file.

### options.fail

Type: `boolean|function`

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

## `reporter.filterByAuthor(options)`

According to the author of GIT commit, downgraded each error to warning that is not commit by this author.
If options are unset, It will lookup author info from environment or git log

### options.name

Type: `string`

Default: `${GIT_AUTHOR_NAME}` || `git log --max-count=1 --no-merges --format=%aN`

### options.email

Type: `string`

Default: `${GIT_AUTHOR_EMAIL}` || `git log --max-count=1 --no-merges --format=%aE`
