var vendorChunk =
  new easepack.webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: '[name].js?[chunkhash:6]',
      minChunks: function (module, count) {
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          (module.resource.indexOf('node_modules') !== -1)
        )
      }
    });

easepack
  .set('mocha', true)
  .set('useEs2015', true)
  .set('output', './dist')
  .set('publicPath', './')
  .addPlugin(vendorChunk)

easepack
  .match('*.{js,html}');
