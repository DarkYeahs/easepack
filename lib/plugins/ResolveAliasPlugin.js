const fs = require('fs');
const Path = require('path');
const async = require('async');
var exec = require('child_process').exec;

const pkg = require('../../package.json');
const sprite = require.resolve('../client/placehold.sprite');
const ResolveTempDirPlugin = require('./ResolveTempDirPlugin');

const hiddenExpr = /^\./
const versionExpr = /^([\w-]+)@(\d)$/;
const repo = ResolveTempDirPlugin.REPO_URL;

function ResolveAliasPlugin() {}

module.exports = ResolveAliasPlugin;

ResolveAliasPlugin.prototype.apply = function (compiler) {
  const config = compiler.config
  const options = compiler.options
  const context = compiler.context
  config.resolve.alias.sprite = sprite

  const updateRepository = callback => {
    const cwd = options.tempComponents
    const cb = err => {
      if (err) {
        compiler.emitError(err)
      }
      if (!options.upToDate) {
        compiler.costTime('UpdateComponent');
      }
      callback(null, options.tempComponents);
    }
    if (!fs.existsSync(cwd)) {
      exec(`git clone ${repo} ${cwd}`, {stdio: 'inherit'}, cb)
      return
    }
    if (!options.upToDate) {
      exec(`git pull origin`, {cwd, stdio: 'inherit'}, cb)
      return
    }
    cb()
  }

  compiler.plugin('configuration', callback => {
    async.waterfall([
      updateRepository,
      (tempComponents, callback) => {
        readdir(tempComponents, (err) => {
          err && compiler.emitError(err);
          callback();
        })
      },
      callback => {
        readdir(options.privateRepo, (err) => {
          err && compiler.emitError(err);
          callback();
        })
      },
      callback => {
        // handle alias
        Object.keys(options.alias).forEach(key => {
          if (config.resolve.alias[key]) {
            compiler.emitError(`duplicate alias key: ${key}\n`)
          } else {
            let val = options.alias[key]
            if (!Path.isAbsolute(val)) {
              val = Path.resolve(context, val)
            }
            config.resolve.alias[key] = val
          }
        })
        callback()
      }
    ], callback)
  })

  function readdir(dir, callback) {
    if (!dir) return callback();
    fs.readdir(dir, (err, files) => {
      if (err) return callback(new Error(`resolve components ${err}\n`));
      files.forEach(file => {
        var key = Path.basename(file, Path.extname(file));
        if (versionExpr.test(key) && RegExp.$2 === pkg.version[0]) {
          config.resolve.alias[RegExp.$1] = Path.join(dir, file)
        } else if (!hiddenExpr.test(key)) {
          config.resolve.alias[key] = Path.join(dir, file)
        }
      });
      callback();
    })
  }
};
