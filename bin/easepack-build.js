var easepack = require('..');
var fs = require('fs');
var path = require('path');
var ora = require('ora');
var program = require('commander');
var config = require('./easepack-config');

var spawn = require('child_process').spawn;
var repo = 'https://github.com/dante1977/components.git';
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
  .option('--public-path [url]', 'the public URL of the output directory')
  .option('--up-to-date', 'run without update components')
  .option('--use-uglifyjs', 'minify your JavaScript')
  .option('--use-cleancss', 'minify your css file')
  .option('--display-chunks', 'display the separation of the modules into chunks')
  .parse(process.argv);

Object.assign(config, program);

['match', 'media', 'set'].map(function (key) {
  easepack[key] = function () {
    return config[key].apply(config, arguments);
  };
});

config.config = program.config || 'easepack.config.js';
require(path.join(config.context, config.config));

var tempDirs = ['LOCALAPPDATA', 'HOME', 'APPDATA'];
var tempDirName = '.easepack-temp';
var tempPath = '';

for (var i = 0, temp = tempDirs[i]; temp; i++) {
  if (tempPath = process.env[temp]) {
    break;
  }
}
tempPath = tempPath || (__dirname + '/..');
config.tempPath = path.join(tempPath, tempDirName);
config.tempComponents = path.join(config.tempPath, 'components');

if (!config.output) {
  config.output = path.join(config.tempPath, 'web');
  config.publicPath = '/';
  config.watch = true;
  config.dev = true;
} else {
  config.useUglifyjs = config.useUglifyjs === undefined ?
    true : config.useUglifyjs;
  config.useCleancss = config.useCleancss === undefined ?
    true : config.useCleancss;
}

var compiler;

upToDate(config.tempComponents, function () {
  readdir(config.tempComponents, function () {
    compiler = easepack(config);
    if (config.watch) {
      compiler.watch(compilerCallback);
    } else {
      compiler.run(compilerCallback);
    }
  });
});

function compilerCallback(err, stats) {
  if (!config.watch || err) {
    this.webpackCompiler.purgeInputFileSystem();
  }
  spinner.stop();

  if (err) {
    //lastHash = null;
    console.error(err.stack || err);
    if (err.details) console.error(err.details);
    if (!options.watch) {
      process.on("exit", function () {
        process.exit(1); // eslint-disable-line
      });
    }
    return;
  }

  if (this.options.dev) {
    this.server.refresh();
  }

  process.stdout.write(stats.toString({
      colors: true,
      version: false,
      chunkOrigins: false,
      chunkModules: false
    }) + '\n');
}

function upToDate(dir, callback) {
  if (config.upToDate) return callback();

  fs.access(dir, function (err) {
    var git = err ?
      spawn('git', ['clone', '--progress', repo, dir]) :
      spawn('git', ['pull', 'origin'], {cwd: dir});

    git.on('close', function (code) {
      callback(code);
    });
  });
}

function readdir(dir, callback) {
  fs.readdir(dir, function (error, files) {
    if (error) {
      return callback(error);
    }
    files.forEach(function (file) {
      var alias = path.basename(file, path.extname(file));
      config.alias[alias] = path.join(dir, file);
    });
    callback();
  });
}