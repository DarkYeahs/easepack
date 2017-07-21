var fs = require('fs')
var Path = require('path')
const _ = require('lodash')
var Webpack = require('webpack');
var Server = require('./Server');

var ImageminPlugin = require('./plugins/ImageminPlugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');
var SourceMapPlugin = require('./plugins/SourceMapPlugin');
var AssetPathPlugin = require('./plugins/AssetPathPlugin');
var AutoRsyncPlugin = require('./plugins/AutoRsyncPlugin');
var SassOptionsPlugin = require('./plugins/SassOptionsPlugin');
var PrivateRepoWarnPlugin = require('./plugins/PrivateRepoWarnPlugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

const modulesPath = Path.join(__dirname, '../node_modules');

function buildVueLoader(options) {
  var vueLoader = {
    loader: 'vue-loader',
    options: {
      loaders: {}
    }
  };

  var cssLoader = {
    loader: 'css-loader',
    options: {
      minimize: options.useCleancss,
      sourceMap: !!options.useSourceMap
    }
  }

  function generateLoaders(loader, loaderOptions) {
    var loaders = [cssLoader];
    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: !!options.useSourceMap
        })
      })
    }

    if (options.useExtract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader'
      });
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  vueLoader.options.loaders = {
    css: generateLoaders('sass'),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', {indentedSyntax: true}),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }

  if (options.useAutoprefixer) {
    if (typeof options.useAutoprefixer !== 'object') {
      options.useAutoprefixer = {
        browsers: ['iOS >= 7', 'Android >= 4.1']
      }
    }
    vueLoader.options.postcss = [
      require('autoprefixer')(options.useAutoprefixer)
    ]
  }

  return vueLoader;
}

function Compiler(options) {
  Webpack.Compiler.call(this);

  var vueLoader = this._vueLoader = buildVueLoader(options)

  this.options = options;
  this.context = options.context;

  this.errors = [];
  this.assets = {};
  this.config = {
    context: options.context,
    entry: {},
    output: {
      path: options.output,
      filename: '[name].js',
      chunkFilename: '_c_/[id].chunk.js?[chunkhash:6]',
      publicPath: options.publicPath
    },
    resolveLoader: {
      modules: [
        modulesPath, 
        Path.join(this.context, 'node_modules')
      ]
    },
    plugins: [],
    resolve: {
      alias: {},
      extensions: ['.js', '.vue', '.scss', '.sass'],
      modules: [
        modulesPath, 
        Path.join(this.context, 'node_modules')
      ]
    },
    module: {
      rules: [{
        test: /\.vue$/,
        use: [vueLoader]
      }, {
        test: /\.sprite(\?.*)?$/,
        loader: require.resolve('./plugins/spriteLoader')
      }, {
        test: AssetPathPlugin.OTHER_EXT_REG,
        loader: require.resolve('./plugins/urlLoader'),
        options: {
          name: '[path]|[name]|[ext]|[hash:6]'
        }
      }, {
        test: /\.(s?css|sass)$/,
        use: [vueLoader, require.resolve('./plugins/cssVueLoader')]
      }]
    }
  };

  if (options.dev || options.mocha) {
    this.server = new Server(this);
  }
}

module.exports = Compiler;

Compiler.prototype = Object.create(Webpack.Compiler.prototype);
Compiler.prototype.constructor = Compiler;

Compiler.prototype.watch = function (callback) {
  this.config.watch = true
  this.run(compiler => {
    compiler.plugin('done', stats => {
      stats.compilation.fileDependencies = stats.compilation.fileDependencies
        .filter(file => !~file.indexOf(this.options.tempComponents))
      callback.call(this, null, stats)
    })
    this.server.listen(compiler)
  }, 'compiler')
  /*this.run(function (err, stats) {
    if (err) throw err
    if (!stats.lastHash) this.server.listen()
    callback.apply(this, arguments)
  });*/
};

Compiler.prototype.emitError = function (error) {
  if (error) {
    this.errors.push(typeof error === 'string'
      ? new Error(error) : error)
  }
};

Compiler.prototype.run = function (callback, type) {
  var self = this;
  // var lastHash = null;
  var nodeEnv = {};

  if (typeof self.options.nodeEnv === 'object') {
    nodeEnv = self.options.nodeEnv;
  } else {
    nodeEnv['NODE_ENV'] = self.options.nodeEnv || '"production"';
  }

  // Set global NODE_ENV for plugin that dependent on it eg. vue-loader
  process.env.NODE_ENV = JSON.parse(nodeEnv['NODE_ENV']);

  self.config.plugins.push(new Webpack.DefinePlugin({
    'process.env': nodeEnv
  }));

  if (self.options.useExtract) {
    self.config.plugins.push(
      new ExtractTextPlugin({
        filename: '[name].css', allChunks: true
      })
    );
  }
  if (self.options.useEs2015) {
    var babelLoader = {
      use: {loader: 'babel-loader'},
      exclude: /^(node_modules|bower_components)/,
      test: /\.js$/
    }
    var babelOptions = {
      presets: [
        [Path.join(modulesPath, 'babel-preset-es2015'), {modules: false}],
        Path.join(modulesPath, 'babel-preset-stage-2')
      ]
    };

    // if local .babelrc not exits, use default setting
    if (!fs.existsSync(Path.join(self.context, '.babelrc'))) {
      babelLoader.use.options = babelOptions;
      self._vueLoader.options.loaders.js = [{
        loader: 'babel-loader',
        options: babelOptions
      }];
    }

    self.config.module.rules.push(babelLoader);
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
    let uglifyJsOptions = {
      compress: {warnings: false},
      sourceMap: !!self.options.useSourceMap
    }
    if (_.isObject(self.options.useUglifyjs)) {
      Object.assign(uglifyJsOptions, self.options.useUglifyjs)
    }
    self.config.plugins.push(new Webpack.optimize.UglifyJsPlugin(uglifyJsOptions));
  }
  if (self.options.plugins.length > 0) {
    self.config.plugins = self.config.plugins.concat(self.options.plugins);
  }

  self.applyPluginsAsync('configuration', err => {
    if (err) throw err
    self.config.plugins.push(new AssetPathPlugin(self));
    self.config.plugins.push(new SassOptionsPlugin(self.options, 2));
    self.config.plugins.push(new PrivateRepoWarnPlugin(self.options));

    if (self.options.webpackDevServer) {
      var DevServer = require('./DevServer');
      self.server = new DevServer(self.config, self.options);
    } else if (type === 'conf') {
      callback(self.config)
    } else {
      var compiler = self.webpackCompiler = Webpack(self.config)
      compiler.plugin('done', sta => {
        sta.compilation.errors.push.apply(sta.compilation.errors, self.errors)
      })
      if (type === 'compiler') {
        callback(compiler)
      } else {
        compiler.run(callback.bind(self))
      }
    }
  });
}
