var easeapck = require('../..');
easeapck({
  context: 'C:\\Users\\ADMIN\\AppData\\Roaming\\npm\\node_modules\\easepack\\test\\e2e\\mock-ep-app',
  matches: [
    {pattern: 'base64/*.png', props: {url: '[name].str.[ext]?[hash]'}},
    {pattern: '*.{js,html}', props: {}}
  ],
  useEs2015: true,
  useBase64: '15kb',
  publicPath: '//cc.cdn.com/',
  spriteUrl: '[name].spr.[ext]?[hash]'
}).run(function (stats) {
  process.stdout.write(stats.toString({
      colors: true,
      version: false,
      chunkOrigins: false,
      chunkModules: false
    }) + '\n\n');
});