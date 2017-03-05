var vm = require('vm');
var Path = require('path');
var util = require('util');
var Server = require('../Server');
var RawSource = require("webpack-sources").RawSource;
var ModuleWarning = require('webpack/lib/ModuleWarning');

var NodeTemplatePlugin = require("webpack/lib/node/NodeTemplatePlugin");
var NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
var LibraryTemplatePlugin = require("webpack/lib/LibraryTemplatePlugin");
var SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
var LimitChunkCountPlugin = require("webpack/lib/optimize/LimitChunkCountPlugin");

var htmlLoader = require.resolve('./HtmlLoader');

function HtmlPlugin(name, entry, compiler) {
  this.name = name;
  this.entry = entry;
  this.compiler = compiler;
  this.context = compiler.context;
  this.dev = compiler.options.dev;
  this.options = compiler.options;
}

module.exports = HtmlPlugin;

HtmlPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;

  webpackCompiler.plugin('make', function (compilation, callback) {
    var outputOptions = {
      filename: '[name].html',
      publicPath: compilation.outputOptions.publicPath
    };
    var childCompiler = compilation.createChildCompiler('html-webpack-plugin', outputOptions);

    childCompiler.apply(new NodeTemplatePlugin(outputOptions));
    childCompiler.apply(new LibraryTemplatePlugin(null, 'commonjs2'));
    childCompiler.apply(new NodeTargetPlugin());
    childCompiler.apply(new SingleEntryPlugin(self.context, htmlLoader + '!./' + self.entry, self.name));
    childCompiler.apply(new LimitChunkCountPlugin({maxChunks: 1}));

    childCompiler.runAsChild(function (err) {
      callback(err);
    });
  });

  webpackCompiler.plugin('emit', function (compilation, callback) {
    var chuck = compilation.assets[self.entry];
    if (!chuck) return callback();

    var cssAssets = [''];
    var source = self.evaluate(chuck.source());
    var chunks = compilation.getStats().toJson().chunks;

    var publicPath = compilation.mainTemplate.getPublicPath({
      hash: compilation.hash
    });

    source = source.replace(/<!--@@EP_SCR@@(.*?)@@-->/g, function (match, src) {
      var name = self.getEntryName(src);
      if (chunks.every(function (chunk) {
          if (chunk.names[0] !== name) {
            return true;
          } else {
            match = publicPath + chunk.files[0];
            chunk.files.forEach(function (file) {
              if (/\.css($|\?)/.test(file)) {
                cssAssets.push(publicPath + file);
              }
            });
          }
        })) {
        //compilation.warnings.push()
        return src;
      } else {
        return match;
      }
    });

    if (cssAssets.length > 1) {
      source = source.replace(/(\s*)<!--(.*?)-->/g, function (match, indent, comment) {
        if (comment.trim() == 'inject_css') {
          return cssAssets.map(function (file) {
            if (!file) return '';
            return '<link href="' + file + '" rel="stylesheet">'
          }).join(indent);
        }
        return match;
      });
    }

    if (self.dev) {
      var port = self.options.port;
      var ipv4 = self.options.ipv4 || '127.0.0.1';
      var url = Server.LIVERELOAD_URL;
      source += '<script src="' + util.format('//%s:%s%s?snipver=1', ipv4, port, url) + '"/>';
    }

    compilation.assets[self.entry] = new RawSource(source);
    callback();
  });
};

HtmlPlugin.prototype.evaluate = function (source) {
  var newSource = undefined;
  var script = new vm.Script(source);
  var context = new vm.createContext({module: {}});

  try {
    newSource = script.runInContext(context);
  } catch (err) {
  }

  if (newSource && newSource.default) {
    newSource = newSource.default;
  }
  return newSource;
};

HtmlPlugin.prototype.getEntryName = function (src) {
  var assets = this.compiler.assets;
  var filePath = Path.join(this.context, this.entry);
  var entry = Path.relative(Path.dirname(filePath), src).split(Path.sep).join('/');
  return (assets[entry] || {}).name;
};