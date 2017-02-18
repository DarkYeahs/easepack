var glob = require('glob');
var async = require('async');
var Path = require('path');
var Webpack = require('webpack');
var Server = require('./Server');

var ImageminPlugin = require('./plugins/ImageminPlugin');
var HtmlPlugin = require('./plugins/HtmlPlugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');
var AssetPathPlugin = require('./plugins/AssetPathPlugin');
var SassOptionsPlugin = require('./plugins/SassOptionsPlugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

function Compiler(options) {
  this.options = options;
  this.anchor = options.anchor;
  this.context = options.context;

  this.server = new Server(this);

  this.errors = [];
  this.assets = {};
  this.config = {
    context: options.context,
    entry: {},
    output: {
      publicPath: options.publicPath,
      path: options.output,
      filename: '[name].js',
      chunkFilename: '[id].chunk.js'
    },
    resolveLoader: {
      modules: [
        Path.join(this.context, 'node_modules'),
        Path.join(__dirname, '../node_modules')
      ]
    },
    plugins: [
      new SassOptionsPlugin(options),
      new ExtractTextPlugin({
        filename: '[name].css', allChunks: true
      }),
      new Webpack.BannerPlugin([
        this.anchor, this.context.substr(3)
      ].join(','))
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
          test: Compiler.IMAGE_EXT_REG,
          loader: 'file-loader',
          options: {
            name: '[path][name]|[ext]|[hash:6]'
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
module.exports.IMAGE_EXT_REG = /\.(png|jpe?g|gif|svg)(\?.*)?$/;

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

    if (self.options.useImagemin) {
      self.config.plugins.push(new ImageminPlugin({}));
    }
    if (self.options.useCleancss) {
      self.config.plugins.push(new CleancssPlugin({}));
    }
    if (self.options.useUglifyjs) {
      self.config.plugins.push(new Webpack.optimize.UglifyJsPlugin({}));
    }
    if (!self.options.dev) {
      self.config.plugins.push(new Webpack.DefinePlugin({
        'process.env': {NODE_ENV: '"production"'}
      }));
    }
    self.config.plugins.push(new AssetPathPlugin(self));

    var compiler = self.webpackCompiler = Webpack(self.config);
    if (self.config.watch) {
      compiler.watch({}, _callback);
    } else {
      compiler.run(_callback);
    }
  });
};

Compiler.prototype.emitError = function (error) {
  if (error) {
    this.errors.push(typeof error == 'string'
      ? new Error(error) : error);
  }
};