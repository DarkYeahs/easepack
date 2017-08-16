var path = require('path');
var easeapck = require('../..');

easeapck({
  plugins: [],
  context: path.resolve('./mock-ep-app'),
  matches: [
    {pattern: 'base64/*.png', props: {url: '[name].str.[ext]?[hash]'}},
    {pattern: '*.{js,html}', props: {}}
  ],
  dev: true,
  port: 8080,
  useEs2015: true,
  useExtract: true,
  useBase64: '15kb',
  publicPath: '//cc.cdn.com/',
  config: 'easepack.config.js',
  spriteUrl: '[name].spr.[ext]?[hash]'
}).run(function (err, stats) {
  if (err) {
    console.log(err);
    return;
  }
  process.stdout.write(stats.toString({
      colors: true,
      version: false,
      chunkOrigins: false,
      chunkModules: false
    }) + '\n\n');
});