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

var cssExpr = /\.css($|\?)/;
var cmtExpr = /(\s*)<!--(.*?)-->/g;
const phExpr = /<!--@(.*?)@(.*?)@-->/g;

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

  compiler.plugin('emit', (compilation, callback) => {
    var entry = `${loader}!./${self.entry}`;
    var mainTemplate = compilation.mainTemplate;
    var compiler_ = compilation.createChildCompiler(name, htmlOptions);

    compiler_.apply(new NodeTemplate(htmlOptions));
    compiler_.apply(new LibraryTemplate(null, 'commonjs2'));
    compiler_.apply(new NodeTargetPlugin());
    compiler_.apply(new SingleEntry(context, entry, self.name));
    compiler_.apply(new LimitChunkCount({maxChunks: 1}));

    compiler_.runAsChild((err) => {
      if (err) return callback(err);

      var source = null;
      var fileAssets = {};
      var chuck = compilation.assets[self.entry];

      try {
        source = evaluate(chuck.source())
      } catch (err) {
        return callback(err);
      }

      var cssAssets = [];
      var chunks = compilation.getStats().toJson().chunks;
      var publicPath = mainTemplate.getPublicPath({hash: compilation.hash});

      chunks.forEach((chunk) => {
        fileAssets[chunk.names[0]] = chunk.files[0];
        chunk.files.forEach((file) => {
          cssExpr.test(file) && cssAssets.push(publicPath + file);
        })
      });

      var cssInjected = false;
      cssAssets = cssAssets.map((css) => `<link href="${css}" rel="stylesheet">`);

      source = source.replace(phExpr, (match, type, src) => {
        switch (type) {
          case 'css_inject':
            cssInjected = true;
            return cssAssets.join(`\r\n${src}`);
          case 'script':
            var name = getEntryName(src);
            return `${publicPath}${fileAssets[name]}`;
        }
        return '';
      });

      if (!cssInjected) {
        source = source.replace(cmtExpr, (match, indent, src) => {
          if (src.trim() == 'inject_css') {
            return cssAssets.join(`\r\n${indent}`);
          }
          return match;
        });
      }

      if (options.dev) {
        var port = options.port;
        var url = Server.LIVERELOAD_URL;
        var ipv4 = self.options.ipv4 || '127.0.0.1';
        source += `<script src="//${ipv4}:${port}${url}?snipver=1"></script>`;
      }

      compilation.assets[self.entry] = new RawSource(source);
      callback(null);
    })
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