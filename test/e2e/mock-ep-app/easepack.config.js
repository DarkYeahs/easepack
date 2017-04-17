easepack
  .set('mocha', true)
  .set('useEs2015', true)
  .set('output', './dist')
  .set('useBase64', '15kb')
  .set('publicPath', '//cc.cdn.com/')
  .set('spriteUrl', '[path][name].spr.[ext]?[hash]')
  .media('m1', {
    nodeEnv: '"m1"',
    upToDate: true,
    useSourceMap: true,
    useAutoprefixer: true,
    banner: 'custom a banner',
    privateRepo: '../mock-components'
  })
  .media('m2', {
    output: false,
    publicPath: '/',
    useSourceMap: true,
  });

easepack
  .match('base64/*.png', {
    url: '[path][name].str.[ext]?[hash]'
  })
  .match('*.md', {
    emit: true
  })
  .match('*.sac', {
    url: '[path][name][hash].[ext]'
  })
  .media('willnotmatch', {
    url: '[path][name].[ext]'
  });

easepack
  .match('*.md')
  .media('m1', {
    url: '[path][name].[hash].[ext]'
  });

easepack
  .match('*.{js,html}');
