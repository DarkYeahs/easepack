var glob = require("glob");
var Tapable = require('tapable');
var Promise = require('bluebird');

function Compiler(options) {
  Tapable.call(this);

  this.options = options;
  this.webpack = {};
  this.context = options.context;
}

module.exports = Compiler;

Compiler.prototype = Object.create(Tapable.prototype);
Compiler.prototype.constructor = Compiler;

Compiler.prototype.run = function (callback) {
  var matches = this.options.matches;
  Promise.map(matches, function (match) {
    return new Promise(function (resolve, reject) {
      glob(match.pattern, {}, function (err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }).done(function () {

  });
};

