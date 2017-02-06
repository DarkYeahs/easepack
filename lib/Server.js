var express = require('express');

function Server(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;

  this.port = this.options.port || 8080;
  this.contentBase = this.options.output;
}

module.exports = Server;

Server.prototype.listen = function () {
  this.app = express();
  this.app.use(express.static(this.contentBase));
  this.app.listen(this.port);
};