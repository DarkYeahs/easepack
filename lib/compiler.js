var glob = require('glob');
var async = require('async');
var Path = require('path');
var Webpack = require('webpack');
var Server = require('./Server');

var HtmlPlugin = require('./plugins/HtmlPlugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');
var AssertPathPlugin = require('./plugins/AssertPathPlugin');
var SassOptionsPlugin = require('./plugins/SassOptionsPlugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

function Compiler(options) {
  this.options = options;
  this.context = options.context;

  this.server = new Server(this);

  this.assets = {};
  this.config = {
    context: options.context,
    entry: {},
    output: {
      publicPath: options.publicPath,
      path: options.output,
      filename: '[name].js'
    },
    resolveLoader: {
      modules: [
        'node_modules',
        Path.join(__dirname, '../node_modules')
      ]
    },
    plugins: [
      //new SassOptionsPlugin(),
      new AssertPathPlugin(this),
      new Webpack.BannerPlugin(this.context),
      new ExtractTextPlugin({
        filename: '[name].css', allChunks: true
      })
    ],
    resolve: {
      alias: options.alias
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              css: ExtractTextPlugin.extract({
                use: ['css-loader', 'sass-loader'],
                fallback: 'vue-style-loader'
              })
            }
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: 'file-loader',
          options: {
            name: '[path][name]|[ext]|[md5:hash:base64:6]'
          }
        },
        {
          test: /\.(scss|sass)$/,
          use: ExtractTextPlugin.extract({
            use: ['css-loader', 'sass-loader'],
            fallback: 'style-loader'
          })
        }
      ]
    }
  };
}

module.exports = Compiler;

Compiler.prototype.watch = function (callback) {
  this.run(callback);
  this.server.listen();
  this.config.watch = true;
};

Compiler.prototype.run = function (callback) {
  var self = this;
  var _callback = callback.bind(this);

  async.map(this.options.matches, function (match, callback) {
    glob(match.pattern, {}, function (err, result) {
      if (err)
        callback(err);

      result.forEach(function (path) {
        if (self.options.config == path)
          return;

        var _props = self.assets[path] || {};
        self.assets[path] = Object.assign(_props, match.props);
      });
      callback(null, result);
    });
  }, function (error) {
    if (error)
      throw error;

    Object.keys(self.assets).forEach(function (file) {
      var props = self.assets[file];
      var name = props.name = file.replace(/\.\w+$/, '');

      switch (Path.extname(file)) {
        case '.js':
        case '.es6':
          self.config.entry[name] = './' + file;
          break;
        case '.html':
          self.config.plugins.push(new HtmlPlugin(name, file, self.options));
          break;
      }
    });

    self.config.plugins.push(new Webpack.LoaderOptionsPlugin({
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      options: {
        context: self.options.context,
        customInterpolateName: _customInterpolateName
      }
    }));

    if (self.options.dev) {
      self.config.plugins.push(new Webpack.DefinePlugin({
        'process.env': {NODE_ENV: '"production"'}
      }));
    }
    if (self.options.useUglifyjs) {
      self.config.plugins.push(new Webpack.optimize.UglifyJsPlugin({}));
    }
    if (self.options.useCleancss) {
      self.config.plugins.push(new CleancssPlugin({}));
    }

    self.webpackCompiler = Webpack(self.config);
    if (self.config.watch) {
      self.webpackCompiler.watch({}, _callback);
    } else {
      self.webpackCompiler.run(_callback);
    }
  });

  function _customInterpolateName(url) {
    var urlArgs = url.split('|');
    var filename = urlArgs[0] + '.' + urlArgs[1];

    var _options = {ext: urlArgs[1], name: urlArgs[0], hash: urlArgs[2]};
    var _props = self.assets[filename];

    if (_props && _props.url) {
      return _props.url.replace(/\[(.*?)\]/g, function () {
        return _options[arguments[1]] || arguments[1];
      });
    }
    return filename;
  }
};