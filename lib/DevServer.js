
var path = require('path');
var express = require('express');
var webpack = require('webpack');
var proxyMiddleware = require('http-proxy-middleware');
var querystring = require('querystring');

module.exports = DevServer;

function forceOutputToFileSystem(compiler) {
  var outputFileSystem = compiler.outputFileSystem;
  Object.defineProperty(compiler, 'outputFileSystem', {
    get: function () {
      return outputFileSystem
    },
    set: function () {
      // modify forbidden
    }
  });
}

function DevServer(compiler) {
  this.compiler = compiler
  this.options = compiler.options;
  this.options.plugins.push(new webpack.HotModuleReplacementPlugin())
  this.compiler.multi.push(path.join(__dirname, './client/dev-client'))
}

DevServer.prototype.listen = function (compiler) {
  var app = express();
  var config = this.options
  var webpackConfig = this.compiler.config

  // Object.keys(webpackConfig.entry).forEach((name) => {
  //   webpackConfig.entry[name] = [path.join(__dirname, './client/dev-client')].concat(webpackConfig.entry[name]);
  // })

  // webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

  // var compiler = webpack(webpackConfig);

  // 用 config.ipv4 配置 webpack-hot-middleware/client 的 path
  compiler.plugin('compilation', function (compilation, params) {
    params.normalModuleFactory.plugin('before-resolve', function (context, callback) {
      if (~context.request.indexOf('webpack-hot-middleware/client')) {
        var requests = context.request.split('?')
        var params = querystring.parse(requests[1] || '')

        params.path = `http://${config.ipv4}:${config.port}/__webpack_hmr`;
        requests[1] = querystring.stringify(params)
        context.request = requests.join('?')
      }
      callback(null, context)
    });
  })

  // if (config.output) {
  //   forceOutputToFileSystem(compiler)
  // }

  var DevServerConfig = {};

  if (typeof config.webpackDevServer === 'object') {
    DevServerConfig = config.webpackDevServer;
  }

  var devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: '/',
    quiet: !!DevServerConfig.quiet,
    stats: {
      colors: true
    }
  });

  var hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: () => { }
  });

  var proxyTable = config.proxyTable || {};

  // proxy api requests
  Object.keys(proxyTable).forEach(function (context) {
    var options = proxyTable[context]
    if (typeof options === 'string') {
      options = { target: options }
    }
    app.use(proxyMiddleware(options.filter || context, options))
  })

  // force reload page whem html emit
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' })
      cb()
    })
  })

  // handle fallback for HTML5 history API
  app.use(require('connect-history-api-fallback')())

  // serve webpack bundle output
  app.use(devMiddleware)

  // enable hot-reload and state-preserving
  // compilation error display
  app.use(hotMiddleware)

  app.use(express.static(webpackConfig.output.path))

  devMiddleware.waitUntilValid(function () {
    console.log(`> Listening at http://${config.ipv4}:${config.port}\n`)
  })

  app.listen(config.port, function (err) {
    if (err) {
      console.log(err)
    }
  })

  this.hotMiddleware = hotMiddleware;
}

DevServer.prototype.reload = function () {
  this.hotMiddleware.publish({ action: 'reload' })
}
