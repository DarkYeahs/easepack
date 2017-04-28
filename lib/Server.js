var fs = require('fs');
var ws = require('ws');
var path = require('path');
var express = require('express');

var pkg = require('../package.json');

const LIVERELOAD_URL = '/__easepack_dev_server__/livereload.js';

function Server(compiler) {
  this.compiler = compiler;
  this.version = pkg.version;
  var opt = this.options = compiler.options;

  this.port = this.options.port;
  //this.contentBase = this.options.output;
  if ((opt.dev || opt.mocha) && !opt.webpackDevServer) {
    this.options.plugins.push(new HotUpdatePlugin(this));
    this.options.plugins.push(new ReloadPlugin(compiler));
  }
}

function ReloadPlugin(compiler) {
  this.compiler = compiler;
}

ReloadPlugin.prototype.apply = function(compiler) {
  var self = this.compiler;
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-before-emit', function (source) {
      var port = self.options.port;
      var ipv4 = self.options.ipv4 || '127.0.0.1';
      source += `<script src="//${ipv4}:${port + LIVERELOAD_URL}?snipver=1"></script>`;
      return source;
    })
  })
}

function HotUpdatePlugin(server) {
  this.server = server;
}

HotUpdatePlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', (compilation) => {
    compilation.plugin("optimize-chunk-assets", (chunks, callback) => {
      console.log(chunks, '=====')
      callback();
    });
  });
}


module.exports = Server;
module.exports.ReloadPlugin = ReloadPlugin;
module.exports.HotUpdatePlugin = HotUpdatePlugin;
module.exports.LIVERELOAD_URL = LIVERELOAD_URL;

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