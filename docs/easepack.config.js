easepack
  .set('rsyncMsg', '手机直播PK模板提交')
  .set('spriteUrl', '[name].sprite.[ext]?[hash]')
  .set('privateRepo', 'E:/workplace/ep_components')
  .media('dev', {
    autoRsync: true,
    //output: './release',
    publicPath: '//192.168.229.171/web/activity/mobileActivity/release/'
  });

easepack
  .match('*.html')

  .match('entries/*.js', {
    url: '[name].[ext]?[hash]'
  })

  .match('components/*.md', {
    emit: true
  })

  .match('**/*.png', {
    url: '[name].[ext]?[hash]'
  });