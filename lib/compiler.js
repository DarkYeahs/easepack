var glob = require('glob');
var async = require('async');
var Path = require('path');
var os = require('os');
var Webpack = require('webpack');
var Server = require('./Server');

var HtmlPlugin = require('./plugins/HtmlPlugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');
var AssertPathPlugin = require('./plugins/AssertPathPlugin');
//var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

function Compiler(options) {
  this.options = options;
  this.context = options.context;

  this.server = new Server(this);

  this.assets = {};
  this.config = {
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
    context: options.context,
    module: {
      rules: [
        {
          test: /\.(scss|sass)$/,
          use: ExtractTextPlugin.extract({
            use: ['raw-loader', 'sass-loader'],
            fallback: 'style-loader'
          })
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              css: ExtractTextPlugin.extract({
                use: ['raw-loader', 'sass-loader'],
                fallback: 'vue-style-loader'
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
      new AssertPathPlugin(this),
      new ExtractTextPlugin("[name].css"),
      new Webpack.BannerPlugin(this.context)
    ]
  };
}

module.exports = Compiler;

//Compiler.prototype = Object.create(Tapable.prototype);
//Compiler.prototype.constructor = Compiler;

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
      var filename = props.name = file.replace(/\.\w+$/, '');

      switch (Path.extname(file)) {
        case '.js':
        case '.es6':
          self.config.entry[filename] = './' + file;
          break;
        case '.html':
          self.config.plugins.push(new HtmlPlugin(self, file));
          break;
      }
    });

    if (self.options.useUglifyjs) {
      self.config.plugins.push(new Webpack.optimize.UglifyJsPlugin({}));
    }

    if (self.options.useCleancss) {
      self.config.plugins.push(new CleancssPlugin({}));
    }

    self.config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'file-loader',
      options: {
        name: '[path][name].[ext]'
      }
    });
    //console.log(JSON.stringify(self.config.module.rules))
    self.webpackCompiler = Webpack(self.config);

    if (self.config.watch) {
      self.webpackCompiler.watch({}, _callback);
    } else {
      self.webpackCompiler.run(_callback);
    }
  });
};
