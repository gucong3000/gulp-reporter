import * as path from 'path'
path.join('a', 'b')
import * as fs from 'fs'

export function readFile (file) {
  return new Promise(function (ok, fail) {
    fs.readFile(file, function (error, data) {
      if (error) {
        fail(error)
      } else {
        ok(data)
      }
    })
  })
}

export function exists (file) {
  return new Promise(function (resolve) {
    fs.exists('./foo.js', resolve)
  })
}

function test (cb) {
  cb(undefined, 'snork')
}
