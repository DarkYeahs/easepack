var vm = require('vm');
var _ = require('lodash');
var Path = require('path');
var util = require('util');

var Webpack = require('webpack');
var Server = require('../Server');
var _extend = require('lodash/extend');
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
const phExpr = /<!--§(.*?)§(.*?)§-->/g;
const scrptExpr = /<!--§script§(.*?)§-->/g;

module.exports = HtmlPlugin;

function HtmlPlugin(props, entry, easepack) {
  this.easepack = easepack;
  this.name = props.name;
  this.url = props.url;
  this.entry = entry;
}

HtmlPlugin.prototype.apply = function (compiler) {
  var self = this;
  var outputName = null;
  var context = self.easepack.context;
  var options = this.easepack.options;

  var htmlOptions = {
    filename: '[name].html',
    publicPath: options.publicPath
  };

  compiler.plugin('make', (compilation, callback) => {
    var entry = `!!${loader}!./${self.entry}`;
    var compiler_ = compilation.createChildCompiler(name, htmlOptions);

    compiler_.apply(new NodeTemplate(htmlOptions));
    compiler_.apply(new LibraryTemplate(null, 'commonjs2'));
    compiler_.apply(new NodeTargetPlugin());
    compiler_.apply(new SingleEntry(context, entry, self.name));
    compiler_.apply(new LimitChunkCount({maxChunks: 1}));

    compiler_.plugin('this-compilation', (compilation) => {
      compilation.mainTemplate.plugin('asset-path', (path, data) => {
        path == '[name].html' && (data.url = self.url);
        return path;
      })
    });

    compiler_.runAsChild((err, entries) => {
      outputName = entries[0].files[0];
      callback(err);
    });
  });

  compiler.plugin('emit', (compilation, callback) => {
    var cssAsset = [];
    var fileAssets = {_p: {}, _i: {}};
    var source = compilation.assets[outputName];

    try {
      source = evaluate(source.source());
    } catch (err) {
      source = err;
      compilation.errors.push(`${err} ${self.entry}\n`);
      return callback();
    }

    var mainTemplate = compilation.mainTemplate;
    var chunks = compilation.getStats().toJson().chunks;
    var publicPath = mainTemplate.getPublicPath({hash: compilation.hash});

    var genScript = (s) => `<script src="${ publicPath + s }"></script>`;
    var genLink = (c) => `<link href="${publicPath + c}" rel="stylesheet">`;

    const resolvePChunk = (chunk, list) => {
      chunk.parents && chunk.parents.forEach((pid) => {
        var pChunk = _.isObject(pid) ? pid : fileAssets._i[pid];
        !~list.indexOf(pChunk.files[0]) && list.push(pChunk.files[0]);
        resolvePChunk(pChunk, list);
      })
    }
    
    chunks.forEach((chunk) => {
      fileAssets._i[chunk.id] = chunk;
      chunk.names[0] && (fileAssets[chunk.names[0]] = chunk);
    });

    source = source.replace(scrptExpr, (match, src) => {
      var name = getEntryName(src);
      var fileChunk = fileAssets[name];
      var parentChunks = fileAssets._p[src] = [];

      if (fileChunk) {
        resolvePChunk(fileChunk, parentChunks);
        fileChunk.files.forEach((file) => {
          cssExpr.test(file) && !~cssAsset.indexOf(file) && cssAsset.push(file);
        });
        return publicPath + fileChunk.files[0];
      }
      return src;
    });

    source = source.replace(phExpr, (match, type, src) => {
      var _type = type.split('!');
      switch (_type[0]) {
        case 'css_inject':
        case 'css_inject_h':
          return cssAsset.map(genLink).join(`\r\n${src}`);
        
        case 'script_inject':
          var inject = fileAssets._p[_type[1]];
          if (inject && inject.length) {
            inject.reverse();
            return inject.map(genScript).join(`\r\n${src}`) + `\r\n${src}`;
          }

        default:
          return '';
      }
    });
    
    source = compilation.applyPluginsWaterfall('html-webpack-plugin-before-emit', source)
    compilation.assets[outputName] = new RawSource(source);
    compilation.applyPluginsAsyncWaterfall('html-webpack-plugin-after-emit', {name: outputName}, function () {
      // Do nothing
    })
    callback(null);
  });

  function evaluate(source) {
    var script = new vm.Script(source);
    var context = new vm.createContext({module: {}});
    var newSource = script.runInContext(context).default;

    if (!newSource) throw new Error(`can't evaluate empty html file :`);
    return newSource;
  }

  function getEntryName(src) {
    var assets = self.easepack.assets;
    var filePath = Path.join(context, self.entry, '..', src);
    var entry = Path.relative(context, filePath).replace(/\\|\//g, '/');
    return (assets[entry] || {}).name;
  }
};