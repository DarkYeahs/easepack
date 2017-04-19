var easepack = require('..');
var path = require('path');
var program = require('commander');
var config = require('./easepack-config');

Object.defineProperty(global, 'easepack', {
  enumerable: true,
  writable: false,
  value: easepack
});

program
  .usage('[entry]')
  .option('-c, --config [file]', 'use custom config file')
  .option('-o, --output [target]', 'the output directory as an absolute path')
  .option('-m, --media [media]', 'to define different rules for different media types')
  .option('-rm, --rsync-msg [message]', 'set rsync message for this compilation')
  .option('--port [port]', 'set server port')
  .option('--up-to-date', 'build without updating components')
  //.option('--display-chunks', 'display the separation of the modules into chunks')
  .parse(process.argv);

program._media = program.media;
delete program.media;

Object.assign(config, program);

['match', 'media', 'set', 'addPlugin'].map(function (key) {
  easepack[key] = function () {
    return config[key].apply(config, arguments);
  };
});

config.config = program.config || 'easepack.config.js';
require(path.join(config.context, config.config));

if (!config.output) {
  config.watch = true;
  config.dev = true;
} else {
  config.setIfUndefined({
    useUglifyjs: true,
    useCleancss: true,
    useImagemin: true,
    publicPath: '/'
  });
}

var compiler = easepack(config);

if (config.watch) {
  compiler.watch(compilerCallback);
} else {
  compiler.run(compilerCallback);
}

function compilerCallback(err, stats) {
  if (!config.watch || err) {
    this.webpackCompiler.purgeInputFileSystem();
  }
  if (err) {
    console.log(err);
    if (err.details)
      console.error(err.details);
    if (!this.options.watch)
      process.on("exit", () => process.exit(1));
    return;
  }
  process.stdout.write(`${stats.toString({
    colors: true,
    version: false,
    chunkOrigins: false,
    chunkModules: false
  })}\n\n`);
}