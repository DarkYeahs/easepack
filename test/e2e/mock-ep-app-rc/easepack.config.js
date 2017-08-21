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
  .set('useEs2015', true)
  .set('output', './dist')
  .set('useUglifyjs', {
    output: {
      screw_ie8: false
    },
    mangle: {
      screw_ie8: false
    },
    compress: {
      warnings: false,
      screw_ie8: false
    }
  })
  .set('publicPath', './')
  .set('useAutoprefixer', {
    browsers: ['last 4 versions']
  })
  .set('alias', {
    utilities: './utilities',
    vuxDivider: './utilities/vuxDivider'
  })
  .set('privateRepo','../mock-components')
  .addPlugin(vendorChunk)

easepack
  .match('*.{js,html}');
