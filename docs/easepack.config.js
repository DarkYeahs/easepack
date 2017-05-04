easepack
  .set('rsyncMsg', 'easepack文档提交')
  .set('spriteUrl', '[path][name].sprite.[ext]?[hash]')
  //.set('privateRepo', 'E:\\workplace\\ep_components')
  .media('dev', {
    autoRsync: true,
    output: 'E:\\htdocs\\activity\\easepack_doc',
    publicPath: '//192.168.229.171/web/activity/easepack_doc/'
  });

easepack
  .match('*.html')

  .match('entries/config.js', {
    url: '[path][name].[ext]?[hash]'
  })

  .match('**/*.png', {
    url: '[path][name].[ext]?[hash]'
  });