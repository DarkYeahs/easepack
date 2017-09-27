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
  .set('screwIe8', false)
  .set('useEs2015', true)
  .set('output', './dist')
  .set('publicPath', './')
  .set('useAutoprefixer', {
    browsers: ['last 4 versions', 'Android >= 4.1']
  })
  .set('alias', {
    utilities: './utilities',
    vuxDivider: './utilities/vuxDivider'
  })
  .set('privateRepo','../mock-components')
  .addPlugin(vendorChunk)

easepack
  .match('*.{js,html}')
  .match('images.{png,jpg}', {
    url: 'matchspritename.[ext]?[hash]'
  })
