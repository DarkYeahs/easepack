var Path = require('path');
var http = require('http');
var util = require('util');
var async = require('async');
var exec = require('child_process').exec;

//var ts = Object.prototype.toString;
var updateUrl = 'http://192.168.229.171/cgi-bin/update_htdocs.py';

function AutoRsyncPlugin(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;
  this.autoRsync = compiler.options.autoRsync;

  if (typeof this.autoRsync === 'string') {
    compiler.options.output = this.autoRsync;
    compiler.config.output.path = this.autoRsync;
  }
}

module.exports = AutoRsyncPlugin;

AutoRsyncPlugin.prototype.apply = function (compiler) {
  var self = this;
  var options = this.options;
  var ciExpr = /^[\w-]+(?=\\|\/|$)/;
  var urlExpr = /(?:\/|\\)(?=activity|new).*$/;

  var outputPath = Path.isAbsolute(options.output)
    ? options.output
    : Path.join(options.context, options.output);

  compiler.plugin('after-emit', function (compilation, callback) {
    async.waterfall([
      function (callback) {
        self._recursive(outputPath, 3, function (error, path) {
          callback(error && new Error(`Auto rsync failed: ${outputPath} isn't working copy\n`), path)
        });
      },
      function (path, callback) {
        if (outputPath === path) {
          exec('svn add * --force', {cwd: outputPath}, callback);
        } else {
          exec('svn add ' + outputPath + ' --parents', {cwd: path}, callback);
        }
      },
      function (stdout, stderr, callback) {
        var commit = (ciExpr.exec(Path.relative(self.nodePath, outputPath)) || ['*'])[0];
        var msg = JSON.stringify(util.format('%s(%s).',
          self.options.rsyncMsg || 'Auto rsync by easepack', compilation.hash));

        exec(['svn', 'ci', commit, '-m', msg].join(' '), {
          cwd: self.nodePath
        }, callback);
      },
      function (stdout, stderr, callback) {
        var path = urlExpr.exec(self.nodePath) || [];
        var url = updateUrl + path[0];

        if (!path[0]) {
          return callback(new Error(`Auto rsync access url: ${self.nodePath} isn't in svn:htdocs`))
        }

        http.get(url, function (res) {
          callback(res.statusCode === 200 ? null : new Error(`Auto rsync access url failed: ${url}`))
        });
      }
    ], function (error) {
      error && compilation.warnings.push(error);
      callback(null);
    });
  });
};

AutoRsyncPlugin.prototype._recursive = function (nodePath, count, callback) {
  var self = this;
  var recursive = this._recursive;

  exec('svn info', {cwd: nodePath}, function (error) {
    if (error && count > 0) {
      return recursive.call(self, Path.dirname(nodePath), --count, callback);
    } else if (count < 0) {
      return callback(new Error('failed'));
    }
    self.nodePath = nodePath;
    return callback(null, nodePath);
  });
};
