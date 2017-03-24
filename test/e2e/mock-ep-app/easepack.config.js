easepack
  .set('useEs2015', true)
  .set('output', './dist')
  .set('useBase64', '15kb')
  .set('publicPath', '//cc.cdn.com/')
  .set('spriteUrl', '[name].spr.[ext]?[hash]')
  .media('m1', {
  	banner: 'custom a banner'
  });

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
