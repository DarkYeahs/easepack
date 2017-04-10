var vm = require('vm');
var Path = require('path');
var util = require('util');

var Webpack = require('webpack');
var Server = require('../Server');
var RawSource = require("webpack-sources").RawSource;

var ModuleWarning = require('webpack/lib/ModuleWarning');
var SingleEntry = require('webpack/lib/SingleEntryPlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var NodeTemplate = require('webpack/lib/node/NodeTemplatePlugin');

const LibraryTemplate = Webpack.LibraryTemplatePlugin;
const LimitChunkCount = Webpack.optimize.LimitChunkCountPlugin;

const name = 'html-webpack-plugin';
const loader = require.resolve('./htmlLoader');

const cssExpr = /\.css($|\?)/;
const phExpr = /<!--@(.*?)@(.*?)@-->/g;
const scrptExpr = /<!--@script@(.*?)@-->/g;

const genLink = (c) => `<link href="${c}" rel="stylesheet">`;

module.exports = HtmlPlugin;

function HtmlPlugin(name, entry, easepack) {
  this.easepack = easepack;
  this.entry = entry;
  this.name = name;
}

HtmlPlugin.prototype.apply = function (compiler) {
  var self = this;
  var context = self.easepack.context;
  var options = this.easepack.options;

  var htmlOptions = {
    filename: '[name].html',
    publicPath: options.publicPath
  };

  compiler.plugin('make', (compilation, callback) => {
    var entry = `${loader}!./${self.entry}`;
    var compiler_ = compilation.createChildCompiler(name, htmlOptions);

    compiler_.apply(new NodeTemplate(htmlOptions));
    compiler_.apply(new LibraryTemplate(null, 'commonjs2'));
    compiler_.apply(new NodeTargetPlugin());
    compiler_.apply(new SingleEntry(context, entry, self.name));
    compiler_.apply(new LimitChunkCount({maxChunks: 1}));

    compiler_.runAsChild((err) => callback(err));
  });

  compiler.plugin('emit', (compilation, callback) => {
    var cssAsset = [];
    var fileAssets = {};
    var source = compilation.assets[self.entry];

    try {
      source = evaluate(source.source());
    } catch (err) {
      return callback(err);
    }

    var mainTemplate = compilation.mainTemplate;
    var chunks = compilation.getStats().toJson().chunks;
    var publicPath = mainTemplate.getPublicPath({hash: compilation.hash});

    chunks.forEach((chunk) => {
      fileAssets[chunk.names[0]] = chunk;
    });

    source = source.replace(scrptExpr, (match, src) => {
      var name = getEntryName(src);
      var fileChunk = fileAssets[name];

      if (fileChunk) {
        fileChunk.files.forEach((file) => {
          file = publicPath + file;
          cssExpr.test(file) && !~cssAsset.indexOf(file) && cssAsset.push(file);
        });
        return publicPath + fileChunk.files[0];
      }
      return src;
    });

    source = source.replace(phExpr, (match, type, src) => {
      switch (type) {
        case 'css_inject':
        case 'css_inject_h':
          return cssAsset.map(genLink).join(`\r\n${src}`);
        default:
          return '';
      }
    });

    if (options.dev || options.testModel) {
      var port = options.port;
      var url = Server.LIVERELOAD_URL;
      var ipv4 = options.ipv4 || '127.0.0.1';
      source += `<script src="//${ipv4}:${port}${url}?snipver=1"></script>`;
    }

    compilation.assets[self.entry] = new RawSource(source);
    callback(null);
  });

  function evaluate(source) {
    var script = new vm.Script(source);
    var context = new vm.createContext({module: {}});
    var newSource = script.runInContext(context);

    if (newSource && newSource.default) {
      newSource = newSource.default;
    }
    return newSource;
  }

  function getEntryName(src) {
    var assets = self.easepack.assets;
    var filePath = Path.join(context, self.entry);
    var entry = Path.relative(Path.dirname(filePath), src).replace(/\\|\//g, '/');
    return (assets[entry] || {}).name;
  }
};