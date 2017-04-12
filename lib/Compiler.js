var os = require('os');
var fs = require('fs');
var Path = require('path');
var glob = require('glob');
var async = require('async');
var Webpack = require('webpack');
var exec = require('child_process').exec;

var Server = require('./Server');
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
var repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/ep_components.git';

var vueLoader = {
  loader: 'vue-loader',
  options: {
    loaders: {
      css: ExtractTextPlugin.extract({
        fallback: 'vue-style-loader',
        use: ['css-loader?sourceMap', 'sass-loader']
      })
    }
  }
};

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
      extensions: ['.js', '.vue', '.scss', '.sass']
    },
    module: {
      rules: [{
        test: /\.vue$/,
        use: [vueLoader]
      }, {
        test: AssetPathPlugin.OTHER_EXT_REG,
        loader: require.resolve('./plugins/urlLoader'),
        options: {
          name: '[path][name]|[ext]|[hash:6]'
        }
      }, {
        test: /\.(s?css|sass)$/,
        use: [vueLoader, require.resolve('./plugins/cssVueLoader')]
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
  var lastHash = null;
  var hash = loaderUtils.getHashDigest(repo, null, null, 6);

  self.options.tempPath = Path.join(os.tmpdir(), '..', tempDirName);
  self.options.tempComponents = Path.join(self.options.tempPath, `components${hash}`);

  if (self.options.privateRepo
    && !Path.isAbsolute(self.options.privateRepo)) {
    self.options.privateRepo = Path.join(self.context, self.options.privateRepo);
  }

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
  if (self.options.useAutoprefixer) {
    vueLoader.options.postcss = [
      require('autoprefixer')(self.options.useAutoprefixer !== true ?
        self.options.useAutoprefixer : {browsers: ['iOS >= 7', 'Android >= 4.1']})
    ]
  }

  self.beforeCompile((compiler) => {
    self.config.watch
      ? compiler.watch({
      aggregateTimeout: 800,
      ignored: "node_modules/**"
    }, _callback) : compiler.run(_callback);
  });

  function _callback(err, stats) {
    if (!err) {
      if (self.options.dev) {
        self.server.refresh();
      }
      if (self.errors.length) {
        stats.compilation.errors.push.apply(
          stats.compilation.errors, self.errors
        );
      }
      stats.compilation.fileDependencies =
        stats.compilation.fileDependencies.filter((file) => {
          return !~file.indexOf(self.options.tempComponents)
        });
    }
    stats.compilation.lastHash = lastHash;
    lastHash = stats.compilation.hash;
    callback.apply(self, arguments);
  }
};

Compiler.prototype.emitError = function (error) {
  if (error) {
    this.errors.push(typeof error == 'string'
      ? new Error(error) : error);
  }
};

Compiler.prototype.beforeCompile = function (callback) {
  var self = this;
  var config = this.config;

  async.map(this.options.matches, (match, callback) => {
    glob(match.pattern, {cwd: self.context}, (err, result) => {
      if (err) return callback(err);
      
      result.forEach(path => {
        if (path == self.options.config) return;

        var _props = self.assets[path] || {};
        self.assets[path] = Object.assign(_props, match.props);
      });
      callback(null);
    });
  }, (err) => {
    if (err) throw err;

    Object.keys(self.assets).forEach(file => {
      var props = self.assets[file];
      if (!props.name) {
        props.name = file.replace(/\.\w+$/, '');
      }
      switch (Path.extname(file)) {
        case '.js':
          config.entry[props.name] = './' + file;
          break;
        case '.html':
          config.plugins.push(new HtmlPlugin(props.name, file, self));
          break;
        default:
          props.emit && config.plugins.push(new FileEmitPlugin(props, file));
      }
    });
    self._getComponents(() => {
      var cp = self.webpackCompiler = Webpack(config);
      cp.applyPluginsParallel('before-this-compile', () => callback(cp));
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
        var commend, options;

        if (error) {
          commend = ['git', 'clone', repo, self.options.tempComponents, '--progress'];
          options = {stdio: 'inherit'};
        } else {
          commend = ['git', 'pull', 'origin', '--progress'];
          options = {cwd: self.options.tempComponents, stdio: 'inherit'};
        }

        exec(commend.join(' '), options, (err) => {
          err && self.emitError(err);
          callback(null, self.options.tempComponents);
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