var fs = require('fs');
//var ws = require('ws');
var path = require('path');
var express = require('express');

function Server(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;

  this.port = this.options.port || 8080;
  this.contentBase = this.options.output;
}

module.exports = Server;
module.exports.LIVERELOAD_URL = '/__easepack_dev_server__/livereload.js';

Server.prototype.listen = function () {
  this.app = express();
  this.app.use(express.static(this.contentBase));

  this._livereload();
  //this._livereloadServer();
  this.app.listen(this.port);
};

Server.prototype._livereload = function () {
  this.app.get(module.exports.LIVERELOAD_URL, function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    fs.createReadStream(path.join(__dirname, 'client', 'livereload.js')).pipe(res);
  });
};

Server.prototype._livereloadServer = function () {
  this.wss = new ws.Server({port: 8080});
  this.wss.on('connection', function (socket) {
    socket.send("!!ver:" + this.version);
  });
};