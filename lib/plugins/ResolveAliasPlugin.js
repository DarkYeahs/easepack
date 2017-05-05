const fs = require('fs');
const Path = require('path');
const async = require('async');
var exec = require('child_process').exec;

const pkg = require('../../package.json');
const sprite = require.resolve('../client/placehold.sprite');
const ResolveTempDirPlugin = require('./ResolveTempDirPlugin');

const versionExpr = /^([\w\-]+)@(\d)$/;
const repo = ResolveTempDirPlugin.REPO_URL;

function ResolveAliasPlugin() {
}

module.exports = ResolveAliasPlugin;

ResolveAliasPlugin.prototype.apply = function (compiler) {
  var config = compiler.config;
  var options = compiler.options;
  config.resolve.alias.sprite = sprite;

  compiler.plugin('configuration', callback => {
    async.waterfall([
      callback => {
        if (options.upToDate) 
          return callback(null, options.tempComponents);

        fs.access(options.tempComponents, error => {
          var commend, opts;
          if (error) {
            opts = {stdio: 'inherit'};
            commend = ['git', 'clone', repo, options.tempComponents];
          } else {
            commend = ['git', 'pull', 'origin'];
            opts = {cwd: options.tempComponents, stdio: 'inherit'};
          }
          exec(commend.join(' '), opts, (err) => {
            err && compiler.emitError(err);
            callback(null, options.tempComponents);
          });
        });
      },
      (tempComponents, callback) => {
        readdir(tempComponents, (err) => {
          err && compiler.emitError(err);
          callback();
        })
      },
      (callback) => {
        readdir(options.privateRepo, (err) => {
          err && compiler.emitError(err);
          callback();
        })
      }
    ], callback);
  });

  function readdir(dir, callback) {
    if (!dir) return callback();
    fs.readdir(dir, (err, files) => {
      if (err) return callback(new Error(`resolve components ${err}\n`));
      files.forEach(file => {
        var alias = Path.basename(file, Path.extname(file));
        if (versionExpr.test(alias)) {
          if (RegExp.$2 == pkg.version[0])
            config.resolve.alias[RegExp.$1] = Path.join(dir, file);
        } else {
          config.resolve.alias[alias] = Path.join(dir, file);
        }
      });
      callback();
    })
  }
};
