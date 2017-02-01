var glob = require('glob');
var async = require('async');
var Tapable = require('tapable');

function Compiler(options) {
  Tapable.call(this);

  this.assets = {};
  this.config = {
    context: options.context
  };

  this.options = options;
  this.context = options.context;
}

module.exports = Compiler;

Compiler.prototype = Object.create(Tapable.prototype);
Compiler.prototype.constructor = Compiler;

Compiler.prototype.run = function (callback) {
  var self = this;
  async.map(this.options.matches, function (match, callback) {
    glob(match.pattern, {}, function (err, result) {
      if (err)
        callback(err);
      result.forEach(function (path) {
        var _props = self.assets[path] || {};
        self.assets[path] = Object.assign(_props, match.props);
      });
      callback(null, result);
    });
  }, function (error) {
    if (error)
      throw error;
    Object.keys(self.assets).forEach(function (path) {

    });
  });
};

