easepack
  .set('useEs2015', true)
  .set('output', './dist')
  .set('useBase64', '15kb')
  .set('publicPath', '//cc.cdn.com/')
  .set('spriteUrl', '[name].spr.[ext]?[hash]')
  .media('m1', {
    useSourceMap: true,
    useAutoprefixer: true,
  	banner: 'custom a banner'
  })
  .media('m2', {
    output: false,
    publicPath: '/',
    useSourceMap: true
  })

easepack
  .match('base64/*.png', {
	  url: '[name].str.[ext]?[hash]'
  })
  .match('*.md', {
    emit: true
  })
  .media('willnotmatch', {
	  url: '[name].[ext]'
  });

 easepack
  .match('*.md')
  .media('m1', {
  	url: '[name].[hash].[ext]'
  });

easepack
  .match('*.{js,html}');
