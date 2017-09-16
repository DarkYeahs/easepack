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

const vendorChunk =
  new easepack.webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: '[name].js',
    minChunks: function (module, count) {
      return (
        module.resource &&
        /\.js$/.test(module.resource) &&
        (module.resource.indexOf('node_modules') !== -1)
      )
    }
  })

config
  .set('publicPath', '/')
  .set('output', './dist')
  .set('context', context)
  .set('screwIe8', false)
  .set('useUglifyjs', true)
  .set('useAutoprefixer', true)
  // .set('useExtract', false)
  // .set('useEs2015', true)
  // .addPlugin(vendorChunk)
  .match('*.{js,html}')

easepack(config).run(function (err, stats) {
  if (!config.watch || err) {
    this.webpackCompiler.purgeInputFileSystem();
  }
  process.stdout.write(stats.toString({colors: true}));
  // rm(path.join(context, 'dist'))
})