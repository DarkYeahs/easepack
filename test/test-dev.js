// const path = require('path')
// const execa = require('execa')


// const ctx = path.join(__dirname, 'e2e/mock-ep-app-dev')
// const cli = path.join(__dirname, '../bin/easepack-build')

// process.chdir(ctx)
// execa('node', [cli], {stdio: 'inherit'}).then(() => {
//   rm(path.join(ctx, 'dist'))
// })

const path = require('path')
const easepack = require('../')
const rm = require('rimraf').sync
const config = require('../bin/easepack-config')

const context = path.join(__dirname, 'e2e/mock-ep-app-dev')

config
  .set('publicPath', '/')
  .set('output', './dist')
  .set('context', context)
  .match('*.{js,html}')

easepack(config).run(function (err, stats) {
  if (!config.watch || err) {
    this.webpackCompiler.purgeInputFileSystem();
  }
  process.stdout.write(stats.toString({colors: true}));
  rm(path.join(context, 'dist'))
})