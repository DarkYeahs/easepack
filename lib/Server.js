var fs = require('fs');
var ws = require('ws');
var path = require('path');
var express = require('express');

var pkg = require('../package.json');

function Server(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;
  this.version = pkg.version;

  this.port = this.options.port;
  //this.contentBase = this.options.output;
}

module.exports = Server;
module.exports.LIVERELOAD_URL = '/__easepack_dev_server__/livereload.js';

Server.prototype.listen = function () {
  this.app = express();
  this.app.use(express.static(this.compiler.config.output.path));

  this._livereload();
  this._livereloadServer();
  this.app.listen(this.port);
};

Server.prototype._livereload = function () {
  this.app.get(module.exports.LIVERELOAD_URL, function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    fs.createReadStream(path.join(__dirname, 'client/livereload.js')).pipe(res);
  });
};

Server.prototype._livereloadServer = function () {
  var version = this.version;
  this.wss = new ws.Server({port: 35729});
  this.wss.on('connection', function (socket) {
    socket.send("!!ver:" + version);
  });
};

Server.prototype.refresh = function () {
  if (this.wss) {
    var data = JSON.stringify([
      'refresh', {
        apply_js_live: false,
        apply_css_live: false,
        apply_img_live: false,
        original_path: true,
        override_url: true
      }
    ]);
    this.wss.clients.map(function (socket) {
      socket.send(data, function (error) {
      });
    });
  }
};