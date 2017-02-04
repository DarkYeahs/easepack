var glob = require('glob');
var async = require('async');
var Path = require('path');
var Tapable = require('tapable');
var Webpack = require('webpack');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlEasepackPlugin = require('./htmlEasepackPlugin');

function Compiler(options) {
  Tapable.call(this);

  this.options = options;
  this.context = options.context;

  this.assets = {};
  this.config = {
    entry: {},
    output: {
      path: options.output,
      filename: '[name].js'
    },
    resolveLoader: {
      modules: [
        './node_modules',
        Path.join(__dirname, '../node_modules')
      ]
    },
    context: options.context,
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]'
          }
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              css: ExtractTextPlugin.extract({
                loader: 'css-loader!sass-loader',
                fallbackLoader: 'vue-style-loader'
              })
            }
          }
        }
      ]
    },
    resolve: {
      alias: options.alias
    },
    plugins: [
      new ExtractTextPlugin("[name].css")
    ]
  };
}

module.exports = Compiler;

Compiler.prototype = Object.create(Tapable.prototype);
Compiler.prototype.constructor = Compiler;

Compiler.prototype.watch = function (callback) {
  this.run(callback);
  this.config.watch = true;
  //this.config.devServer = {
  //  contentBase: this.options.output,
  //  compress: true,
  //  port: 9000
  //};
};

Compiler.prototype.run = function (callback) {
  var self = this;
  var extExpr = /(.*?)\.\w+$/;

  async.map(this.options.matches, function (match, callback) {
    glob(match.pattern, {}, function (err, result) {
      if (err)
        callback(err);

      result.forEach(function (path) {
        var _props = self.assets[path] || {};
        self.assets[path] = Object.assign(_props, match.props);
      });
      callback(null, result);
    });
  }, function (error) {
    if (error)
      throw error;

    Object.keys(self.assets).forEach(function (path) {
      var signif = Path.parse(path);
      var props = self.assets[path];
      var config = self.config;

      if (signif.dir) {
        props.name = [signif.dir, signif.name].join('/');
      } else {
        props.name = signif.name;
      }

      switch (signif.ext) {
        case '.js':
        case '.es5':
          config.entry[props.name] = './' + path;
          break;
        case '.html':
          config.plugins.push(new HtmlEasepackPlugin(self, path));
          break;
      }
    });

    var webpackCompiler = Webpack(self.config);

    if (self.config.watch) {
      webpackCompiler.watch({}, callback);
    } else {
      webpackCompiler.run(callback);
    }
  });
};

