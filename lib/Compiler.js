var os = require('os');
var fs = require('fs');
var Path = require('path');
var glob = require('glob');
var async = require('async');
var Webpack = require('webpack');
var Server = require('./Server');
var exec = require('child_process').exec;

var pkg = require('../package.json');
var HtmlPlugin = require('./plugins/HtmlPlugin');
var ImageminPlugin = require('./plugins/ImageminPlugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');
var FileEmitPlugin = require('./plugins/FileEmitPlugin');
var SourceMapPlugin = require('./plugins/SourceMapPlugin');
var AssetPathPlugin = require('./plugins/AssetPathPlugin');
var AutoRsyncPlugin = require('./plugins/AutoRsyncPlugin');
var SassOptionsPlugin = require('./plugins/SassOptionsPlugin');
var PrivateRepoWarnPlugin = require('./plugins/PrivateRepoWarnPlugin');

var AddBannerPlugin = require('./plugins/AddBannerPlugin');
var NetworkInfoPlugin = require('./plugins/NetworkInfoPlugin');

var loaderUtils = require("loader-utils");
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var tempDirName = '.easepack-temp';
var repo = 'https://github.com/dante1977/components.git';

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
      path: options.output,
      filename: '[name].js',
      chunkFilename: '[id].chunk.js',
      publicPath: options.publicPath,
    },
    resolveLoader: {
      modules: [
        Path.join(__dirname, '../node_modules'),
        Path.join(this.context, 'node_modules')
      ]
    },
    plugins: [
      new AddBannerPlugin(this),
      new NetworkInfoPlugin(this),
      new ExtractTextPlugin({
        filename: '[name].css', allChunks: true
      })
    ],
    resolve: {
      alias: {},
      extensions: ['.js', '.vue']
    },
    module: {
      rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            css: ExtractTextPlugin.extract({
              fallback: 'vue-style-loader',
              use: ['css-loader?sourceMap', 'sass-loader']
            })
          }
        }
      }, {
        test: AssetPathPlugin.IMAGE_EXT_REG,
        loader: require.resolve('./plugins/urlLoader'),
        options: {
          name: '[path][name]|[ext]|[hash:6]'
        }
      }, {
        test: /\.(css|scss|sass)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader?sourceMap', 'sass-loader']
        })
      }]
    }
  };
}

module.exports = Compiler;

Compiler.prototype.watch = function (callback) {
  this.run(callback);
  this.config.watch = true;
};

Compiler.prototype.run = function (callback) {
  var self = this;
  var _callback = callback.bind(this);
  var hash = loaderUtils.getHashDigest(repo, null, null, 6);

  self.options.tempPath = Path.join(os.tmpdir(), '..', tempDirName);
  self.options.tempComponents = Path.join(self.options.tempPath, 'components' + hash);

  self.config.plugins.push(new AssetPathPlugin(self));
  self.config.plugins.push(new SassOptionsPlugin(self.options));
  self.config.plugins.push(new PrivateRepoWarnPlugin(self.options));

  if (self.options.dev) {
    self.config.output.path = Path.join(self.options.tempPath, 'web');
    self.server.listen();
  } else {
    self.config.plugins.push(new Webpack.optimize.OccurrenceOrderPlugin());
    self.config.plugins.push(new Webpack.DefinePlugin({
      'process.env': {NODE_ENV: '"production"'}
    }));
  }
  if (self.config.output.path
    && !Path.isAbsolute(self.config.output.path)) {
    self.config.output.path = Path.join(self.context, self.config.output.path);
  }
  if (self.options.useEs2015) {
    self.config.module.rules.push({
      options: {presets: [['es2015', {modules: false}], 'stage-2']},
      loader: 'babel-loader',
      test: /\.js$/
    });
  }
  if (self.options.useImagemin) {
    self.config.plugins.push(new ImageminPlugin({}));
  }
  if (self.options.useCleancss) {
    self.config.plugins.push(new CleancssPlugin({}));
  }
  if (self.options.autoRsync) {
    self.config.plugins.push(new AutoRsyncPlugin(self));
  }
  if (self.options.useSourceMap) {
    self.config.plugins.push(new SourceMapPlugin(self));
  }
  if (self.options.useUglifyjs) {
    self.config.plugins.push(new Webpack.optimize.UglifyJsPlugin({}));
  }
  self.beforeCompile(function (compiler) {
    self.config.watch ?
      compiler.watch({aggregateTimeout: 1000}, _callback) :
      compiler.run(_callback);
  });
};

Compiler.prototype.emitError = function (error) {
  if (error) {
    this.errors.push(typeof error == 'string'
      ? new Error(error) : error);
  }
};

Compiler.prototype.beforeCompile = function (callback) {
  var self = this;
  async.map(this.options.matches, function (match, callback) {
    glob(match.pattern, {cwd: self.context}, function (err, result) {
      if (err) callback(err);
      result.forEach(function (path) {
        if (self.options.config == path) return;
        var _props = self.assets[path] || {};
        self.assets[path] = Object.assign(_props, match.props);
      });
      callback();
    });
  }, function () {
    Object.keys(self.assets).forEach(function (file) {
      var props = self.assets[file];
      if (!props.name) 
        props.name = file.replace(/\.\w+$/, '');

      switch (Path.extname(file)) {
        case '.js':
          self.config.entry[props.name] = './' + file;
          break;
        case '.html':
          self.config.plugins.push(new HtmlPlugin(props.name, file, self));
          break;
        default:
          if(props.emit)
            self.config.plugins.push(new FileEmitPlugin(props, file));
      }
    });
    self._getComponents(function () {
      var compiler = self.webpackCompiler = Webpack(self.config);
      compiler.applyPluginsParallel('before-this-compile', function () {
        callback(compiler);
      });
    });
  });
};

Compiler.prototype._getComponents = function (callback) {
  var self = this;
  var versionExpr = /@(\d)$/;
  var calias = self.config.resolve.alias;

  async.waterfall([
    function (callback) {
      if (self.options.upToDate)
        return callback();
      fs.access(self.options.tempComponents, function (error) {
        var commend = ['git', 'pull', 'origin'];
        var options = {cwd: self.options.tempComponents, stdio: 'inherit'};
        if (error) {
          commend = ['git', 'clone', repo, self.options.tempComponents];
          delete options.cwd;
        }
        exec(commend.join(' '), options, function (error) {
          error && self.emitError(error);
          callback(null, self.options.tempComponents)
        });
      });
    },
    function (tempComponents, callback) {
      readdir(tempComponents, function (error) {
        error && self.emitError(error);
        callback(null);
      });
    },
    function (callback) {
      readdir(self.options.privateRepo, function (error) {
        error && self.emitError(error);
        callback(null);
      });
    }
  ], callback);

  function readdir(dir, callback) {
    if (!dir) return callback();

    fs.readdir(dir, function (error, files) {
      if (error) {
        return callback(new Error('reading components ' + error) + '\n');
      }
      files.forEach(function (file) {
        var alias = Path.basename(file, Path.extname(file));

        if (versionExpr.test(alias)) {
          if (RegExp.$1 == pkg.version[0])
            calias[alias.replace(versionExpr, '')] = Path.join(dir, file);
        } else
          calias[alias] = Path.join(dir, file);
      });
      callback();
    });
  }
};