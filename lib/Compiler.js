var fs = require('fs')
var Path = require('path')
const _ = require('lodash')
var Webpack = require('webpack');
const Stats = require('./Stats')

var ImageminPlugin = require('./plugins/ImageminPlugin');
var CleancssPlugin = require('./plugins/CleancssPlugin');
var AssetPathPlugin = require('./plugins/AssetPathPlugin');
var AutoRsyncPlugin = require('./plugins/AutoRsyncPlugin');
var AutoRsync2Plugin = require('./plugins/AutoRsync2Plugin');
var SassOptionsPlugin = require('./plugins/SassOptionsPlugin');
var PrivateRepoWarnPlugin = require('./plugins/PrivateRepoWarnPlugin');
var DontScrewIe8Plugin = require('./plugins/DontScrewIe8Plugin');
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

  // 可以 install 对应的 loader 到本地
  vueLoader.options.loaders = {
    // js: '', // 消取vue-loader默认的使用babel编译JS
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

  this.startTime = Date.now();
  this.options = options;
  this.context = options.context;
  this.multi = [];

  this.errors = [];
  this.assets = {};
  this.config = {
    context: options.context,
    entry: {},
    output: {
      // path: options.output,
      filename: '[name].js',
      chunkFilename: options.filename.chunk,
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
        test: /\.(?:s?css|sass|less|styl(?:us)?)$/,
        loader: require.resolve('./plugins/cssVueLoader'),
        options: vueLoader.options
      }]
    }
  };

  if (options.webpackDevServer) {
    this.server = require('./DevServer')(this)
  } else if (options.dev || options.mocha) {
    this.server = require('./Server')(this)
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
};

Compiler.prototype.emitError = function (error) {
  if (error) {
    this.errors.push(typeof error === 'string'
      ? new Error(error) : error)
  }
};

Compiler.prototype.run = function (callback, type) {
  var self = this;
  var nodeEnv = {};

  let output = this.options.output || {}
  if (_.isString(this.options.output)) {
    output = {path: output}
  }
  this.config.output = Object.assign(output, this.config.output)

  if (typeof self.options.nodeEnv === 'object') {
    nodeEnv = self.options.nodeEnv;
  } else {
    nodeEnv['NODE_ENV'] = self.options.nodeEnv || '"production"';
  }

  process.noDeprecation = true
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
      exclude: /(node_modules|bower_components)/,
      test: /\.js$/
    }
    if (_.isObject(self.options.useEs2015)) {
      Object.assign(babelLoader, self.options.useEs2015)
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
  if (!self.options.screwIe8) {
    self.config.plugins.push(new DontScrewIe8Plugin(this))
  }
  if (this.options.hashedModuleIds) {
    self.config.plugins.push(new Webpack.HashedModuleIdsPlugin())
  }
  if (self.options.useSourceMap) {
    let devtool = '#source-map'
    if (_.isString(self.options.useSourceMap)) {
      devtool = self.options.useSourceMap
    }
    this.config.devtool = devtool
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
    if (err) {
      throw err;
    }
    self.config.plugins.push(new AssetPathPlugin(self));
    self.config.plugins.push(new SassOptionsPlugin(self.options, 2));
    self.config.plugins.push(new PrivateRepoWarnPlugin(self.options));

    if (this.options.autoRsync2) {
      this.config.plugins.push(new AutoRsync2Plugin(this))
    }
    if (this.options.useCommonsChunk) {
      let vendorChunkOptions = {
        name: 'vendor',
        filename: '_c_/[name].js?[chunkhash:6]',
        minChunks (module) {
          return module.resource && /\.js$/.test(module.resource) && ~module.resource.indexOf('node_modules')
        }
      }
      if (_.isObject(this.options.useCommonsChunk)) {
        Object.assign(vendorChunkOptions, this.options.useCommonsChunk)
      }
      this.config.plugins.push(new Webpack.optimize.CommonsChunkPlugin(vendorChunkOptions))
      this.config.plugins.push(new Webpack.optimize.CommonsChunkPlugin({
        name: 'manifest', filename: '_c_/[name].js?[chunkhash:6]', chunks: ['vendor']
      }))
    }
    if (type === 'config') {
      callback(self.config)
    } else {
      var compiler = self.webpackCompiler = Webpack(self.config)
      compiler.plugin('done', sta => {
        sta.compilation.errors.push.apply(sta.compilation.errors, self.errors)
      })
      if (this.options.moreDetails) {
        compiler.plugin('should-emit', () => this.costTime('Compile'))
      }
      this.costTime('Configure');
      if (type === 'compiler') {
        callback(compiler)
      } else {
        compiler.run(callback.bind(self))
      }
    }
  });
}

Compiler.prototype.costTime = function (name) {
  if (!this.options.moreDetails || this.startTime === null) {
    return;
  }
  const lastTime = this.startTime;
  const now = this.startTime = Date.now();
  Stats.normal(`${name}: `);
  Stats.bold(now - lastTime);
  Stats.normal('ms\n');
}
