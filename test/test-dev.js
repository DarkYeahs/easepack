const path = require('path')
const execa = require('execa')
const rm = require('rimraf').sync

console.log(__dirname)
const ctx = path.join(__dirname, 'e2e/mock-ep-app-dev')
const cli = path.join(__dirname, '../bin/easepack-build')

process.chdir(ctx)
execa('node', [cli], {stdio: 'inherit'}).then(() => {
  rm(path.join(ctx, 'dist'))
})

