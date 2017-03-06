var Path = require('path');
var http = require('http');
var util = require('util');
var async = require('async');
var exec = require('child_process').exec;

var updateUrl = 'http://192.168.229.171/cgi-bin/update_htdocs.py';

function AutoRsyncPlugin(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;

  compiler.options.output = this.options.autoRsync;
  compiler.config.output.path = this.options.autoRsync;
}

module.exports = AutoRsyncPlugin;

AutoRsyncPlugin.prototype.apply = function (compiler) {
  var self = this;
  var options = this.options;
  var urlExpr = /(?:\/|\\)(?=activity).*$/;

  var outputPath = Path.isAbsolute(options.output)
    ? options.output
    : Path.join(options.context, options.output);

  compiler.plugin('after-emit', function (compilation, callback) {
    async.waterfall([
      function (callback) {
        self._recursive(outputPath, callback);
      },
      function (nodePath, callback) {
        if (outputPath !== nodePath) {
          exec(['svn', 'add', outputPath, '--parents'].join(' '), {cwd: nodePath}, callback);
        } else {
          exec('svn add * --force', {cwd: outputPath}, callback);
        }
      },
      function (stdout, stderr, callback) {
        var commit = '*';
        var msg = JSON.stringify('Auto commit by easepack');
        if (self.nodePath !== outputPath) {
          commit = Path.relative(self.nodePath, Path.dirname(outputPath));
        }
        exec(['svn', 'commit', commit, '-m', msg].join(' '), {cwd: self.nodePath}, callback);
      },
      function (stdout, stderr, callback) {
        var path = urlExpr.exec(self.nodePath);
        http.get(updateUrl + path[0], function (res) {
          callback();
        });
      }
    ], callback);
  });
};

AutoRsyncPlugin.prototype._recursive = function (nodePath, count, callback) {
  if (typeof count == 'function') {
    callback = count;
    count = 3;
  }
  var self = this;
  var recursive = this._recursive;

  exec('svn info', {cwd: nodePath}, function (error) {
    if (error && count > 0) {
      return recursive.call(self, Path.dirname(nodePath), count--, callback);
    } else if (count <= 0) {
      return callback(error
        ? error
        : new Error('The node not found ' + nodePath));
    }
    self.nodePath = nodePath;
    return callback(null, nodePath);
  });
};