var glob = require('glob');
var async = require('async');
var Path = require('path');
var os = require('os');
var Webpack = require('webpack');
var Server = require('./Server');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');

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
      rules: []
    },
    resolve: {
      alias: options.alias
    },
    plugins: [
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
  var uglifyjs = [];
  var cleancss = [];
  var _callback = callback.bind(this);

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

    Object.keys(self.assets).forEach(function (file) {
      var fileObj = Path.parse(file);
      var props = self.assets[file];

      if (fileObj.dir) {
        props.name = [fileObj.dir, fileObj.name].join('/');
      } else {
        props.name = fileObj.name;
      }

      props.uglifyjs && uglifyjs.push(file);
      props.cleancss && cleancss.push(file);

      switch (fileObj.ext) {
        case '.js':
        case '.es6':
          self.config.entry[props.name] = './' + file;
          break;
        case '.html':
          self.config.plugins.push(new HtmlWebpackPlugin({
            inject: false,
            template: file,
            filename: file
          }));
          break;
      }
    });

    if (uglifyjs.length) {
      self.config.plugins.push(new Webpack.optimize.UglifyJsPlugin({
        include: uglifyjs
      }));
    }

    if (cleancss.length) {
      self.config.plugins.push(new CleancssPlugin({
        include: cleancss
      }));
    }

    self.config.module.rules.push.apply(
      self.config.module.rules,
      [{
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]'
        }
      }, {
        test: /\.(scss|sass)$/,
        use: ExtractTextPlugin.extract({
          use: ['raw-loader', 'sass-loader'],
          fallback: 'style-loader'
        })
      }, {
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
      }]
    );
    self.webpackCompiler = Webpack(self.config);

    if (self.config.watch) {
      self.webpackCompiler.watch({}, _callback);
    } else {
      self.webpackCompiler.run(_callback);
    }
  });
};
