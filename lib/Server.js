var fs = require('fs');
var ws = require('ws');
var path = require('path');
var express = require('express');

var utils = require("loader-utils");
var ExtractText = require('extract-text-webpack-plugin');

const pkg = require('../package.json');
const extractText = new ExtractText({});

const mapExpr = /\.(map|html)(\?.*)?$/;
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

ReloadPlugin.prototype.apply = function (compiler) {
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
  this.hash = {};
  this.changed = [];
  this.server = server;
}

HotUpdatePlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', (compilation) => {
    compilation.plugin("html-webpack-plugin-after-emit", (data) => {
      if (!data.isCached) this.changed.push(data.name);
    });
  });
  compiler.plugin('done', (stats) => {
    var hash = null;
    var assets = stats.compilation.assets;
    this.changed = this.changed.concat(Object.keys(assets).filter(k => {
      var source = assets[k].source();
      if (!mapExpr.test(k) && (hash = utils.getHashDigest(source)) && hash != this.hash[k]) {
        return !!(this.hash[k] = hash);
      }
    }));
    this.server.refresh(this.changed);
    this.changed = [];
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

Server.prototype.refresh = function (changed) {
  if (this.wss) {
    var data = JSON.stringify([
      'refresh', {path: changed}
    ]);
    this.wss.clients.forEach(socket => {
      socket.send(data, (error) => {
      })
    })
    //var data = JSON.stringify([
    //  'refresh', {
    //    apply_js_live: false,
    //    apply_css_live: false,
    //    apply_img_live: false,
    //    original_path: true,
    //    override_url: true,
    //    changed: changed
    //  }
    //]);
  }
};