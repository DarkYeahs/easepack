var easepack = require('..');
var fs = require('fs');
var path = require('path');
var ora = require('ora');
var async = require('async');
var program = require('commander');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var pkg = require('../package.json');
var config = require('./easepack-config');

var repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/ep_components.git';
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
  .option('--private-repo [path]', 'the private component repository')
  .option('--up-to-date', 'run without update components')
  .option('--use-uglifyjs', 'minify your javascript file')
  .option('--use-cleancss', 'minify your css file')
  .option('--use-imagemin', 'minify your image(png) file')
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
  config.setIfUndefined({
    useUglifyjs: true,
    useCleancss: true,
    useImagemin: true,
    publicPath: '/'
  });
}

upToDate(config.tempComponents, function (updateErr) {
  readdir([config.tempComponents, config.privateRepo], function (readErr) {
    var compiler = easepack(config);
    compiler.emitError(updateErr);
    compiler.emitError(readErr);

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
    //console.error(err.stack || err);
    if (err.details) console.error(err.details);
    if (!options.watch) {
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
    }) + '\n');
}

function upToDate(dir, callback) {
  async.parallel([
    function (callback) {
      if (config.upToDate) {
        return callback();
      }
      fs.access(dir, function (error) {
        var err, git = error ?
          spawn('git', ['clone', '--progress', repo, dir]) :
          spawn('git', ['pull', 'origin'], {cwd: dir});

        git.stderr.on('data', function (data) {
          err = new Error('update components ' + data.toString());
        });

        git.on('close', function (code) {
          callback(code > 0 ? err : undefined);
        });
      });
    }, function (callabck) {
      exec('git config --get user.name', function (error, name) {
        if (name) {
          config.anchor = JSON.stringify(name.toString().trim()).slice(1, -1);
        }
        callabck();
      });
    }], callback);
}

function readdir(dirs, callback) {
  async.eachSeries(dirs, function (dir, callback) {
    if (!dir) {
      return callback();
    }
    fs.readdir(dir, function (error, files) {
      if (error) {
        return callback(new Error('reading components ' + error) + '\n');
      }
      files.forEach(function (file) {
        var alias = path.basename(file, path.extname(file));
        var versionExpr = /@(\d)$/;

        if (versionExpr.test(alias)) {
          if (RegExp.$1 == pkg.version[0]) {
            config.alias[alias.replace(versionExpr, '')] = path.join(dir, file);
          }
        } else {
          config.alias[alias] = path.join(dir, file);
        }
      });
      callback();
    });
  }, callback);
}