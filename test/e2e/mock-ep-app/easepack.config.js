easepack
  .set('useEs2015', true)
  .set('useBase64', '15kb')
  .set('publicPath', '//cc.cdn.com/')
  .set('spriteUrl', '[name].spr.[ext]?[hash]');

easepack.match('base64/*.png', {
  url: '[name].str.[ext]?[hash]'
}).media('dist', {
  url: '[name].[ext]'
});

easepack.match('*.{js,html}');
