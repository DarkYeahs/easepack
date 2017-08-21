var fs = require('fs');
var ws = require('ws');
var path = require('path');
var express = require('express');
var middleware = require('webpack-dev-middleware')

var utils = require('loader-utils');
const pkg = require('../package.json');

const queryExpr = /(.*?\.(\w+))(\?.*)?$/;
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

    var urls = [opt.spriteUrl].concat(opt.matches.map(m => {
      return m.props.url;
    }));
    for (var i = 0, l = urls.length; i < l; i++) {
      if (urls[i] && ~urls[i].split('?')[0].indexOf('[hash]')) {
        var err = new Error(`${urls[i]} : Can't use [hash] as name in development (use ?[hash] instead)\n`);
        compiler.errors.push(err);
        break;
      }
    }
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
  this.change = [];
  this.server = server;
}

HotUpdatePlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', (compilation) => {
    compilation.plugin('html-webpack-plugin-after-emit', (data) => {
      data.isCached || this.change.push(data.name);
    });
  });
  compiler.plugin('done', (stats) => {
    var assets = stats.compilation.assets;
    Object.keys(assets).forEach(key => {
      var args = queryExpr.exec(key);
      var hash = utils.getHashDigest(assets[key].source());
      if (args && !/^map|html$/.test(args[2]) && hash !== this.hash[args[1]]) {
        this.hash[args[1]] = hash;
        this.change.push(key);
      }
    });
    this.server.refresh(this.change);
    this.change = [];
  });
}

module.exports = Server;
module.exports.ReloadPlugin = ReloadPlugin;
module.exports.HotUpdatePlugin = HotUpdatePlugin;
module.exports.LIVERELOAD_URL = LIVERELOAD_URL;

Server.prototype.listen = function (webpackCompiler) {
  this.app = express()
  this.app.use(middleware(webpackCompiler, {
    publicPath: '/',
    noInfo: true,
    quiet: true
  }))
  this._livereload()
  this._livereloadServer()
  this.app.listen(this.port)
  /*this.app = express();
  this.app.use(express.static(this.compiler.config.output.path));
  this._livereload();
  this._livereloadServer();
  this.app.listen(this.port);*/
};

Server.prototype._livereload = function () {
  this.app.get(module.exports.LIVERELOAD_URL, function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    fs.createReadStream(path.join(__dirname, 'client/livereload.js')).pipe(res);
  });
};

Server.prototype._livereloadServer = function () {
  var version = this.version;
  this.wss = new ws.Server({port: parseInt(this.port, 10) + 100});
  this.wss.on('connection', function (socket) {
    socket.send('!!ver:' + version);
  });
};

Server.prototype.refresh = function (change) {
  if (this.wss && change.length) {
    var ext = null
    var dataArr = []

    for (var i = 0, file; (file = change[i]); i++) {
      if ((ext = queryExpr.exec(file))) {
        if (/^js|html$/.test(ext[2])) {
          dataArr.push(JSON.stringify(['refresh', {
            path: this.options.publicPath + file,
            apply_css_live: false,
            apply_img_live: false
          }]));
        }
        if (ext[2] === 'css') {
          dataArr.push(JSON.stringify(['refresh', {
            path: this.options.publicPath + file,
            apply_img_live: false,
            apply_css_live: true
          }]))
        }
        if (/^jpe?g|png|gif$/.test(ext[2])) {
          dataArr.push(JSON.stringify(['refresh', {
            path: this.options.publicPath + file,
            apply_css_live: false,
            apply_img_live: true
          }]));
        }
      }
    }
    this.wss.clients.forEach(socket => {
      dataArr.forEach(data => {
        socket.send(data, () => {
        });
      })
    });
  }
};
