var easepack = require('..');
var path = require('path');
var ora = require('ora');
var program = require('commander');
var config = require('./easepack-config');

var spinner = ora().start();

Object.defineProperty(global, 'easepack', {
  enumerable: true,
  writable: false,
  value: easepack
});

program
  .usage('[entry]')
  .option('-c, --config [file]', 'use custom config file')
  .option('-o, --output [target]', 'write the files to disk')
  .option('-m, --media [media]', 'output directory for bundled files')
  .option('--port [port]', 'set server port')
  .option('--rsync-msg [message]', 'set message for this compilation')
  .option('--public-path [url]', 'the public URL of the output directory')
  .option('--private-repo [path]', 'the private component repository')
  .option('--up-to-date', 'run without update components')
  .option('--use-uglifyjs', 'minify your javascript file')
  .option('--use-cleancss', 'minify your css file')
  .option('--use-imagemin', 'minify your image(png) file')
  .option('--use-base64', 'inline your image in base64 way')
  .option('--use-sourcemap', 'generate sourcemap file for js/css file')
  .option('--display-chunks', 'display the separation of the modules into chunks')
  .parse(process.argv);

program._media = program.media;
delete program.media;

Object.assign(config, program);

['match', 'media', 'set'].map(function (key) {
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

config.setIfUndefined({
  useBase64: '2kb',
  publicPath: '/',
  port: 8080
});

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
  spinner.stop();

  if (err) {
    console.log(err);
    if (err.details) console.error(err.details);
    if (!this.options.watch) {
      process.on("exit", function () {
        process.exit(1);
      });
    }
    return;
  }
  if (this.options.dev) {
    this.server.refresh();
  }
  if (this.errors.length) {
    stats.compilation.errors.push.apply(
      stats.compilation.errors,
      this.errors
    )
  }

  process.stdout.write(stats.toString({
      colors: true,
      version: false,
      chunkOrigins: false,
      chunkModules: false
    }) + '\n\n');
}