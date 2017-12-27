var vm = require('vm');
var _ = require('lodash');
var Path = require('path');

var Webpack = require('webpack');
var utils = require('loader-utils');
var RawSource = require('webpack-sources').RawSource;

var SingleEntry = require('webpack/lib/SingleEntryPlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var NodeTemplate = require('webpack/lib/node/NodeTemplatePlugin');

const LibraryTemplate = Webpack.LibraryTemplatePlugin;
const LimitChunkCount = Webpack.optimize.LimitChunkCountPlugin;

const name = 'html-webpack-plugin';
const loader = require.resolve('./htmlLoader');
const imports = require('../client/templateImports');

const cssExpr = /\.css($|\?)/;
const phExpr = /<!--§(.*?)§(.*?)§-->/g;
const scrptExpr = /<!--§script§(.*?)§-->/g;

const templateError = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width"/>
  <title>template error</title>
</head>
<body style="color:red;">_error_</body>
</html>`;

module.exports = HtmlPlugin;

function HtmlPlugin(props, entry, easepack) {
  this.easepack = easepack;
  this.entry = entry;
  this.name = props.name;
  this.url = props.url || '[path][name].html';
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

    compiler_.parentOptions_ = compilation.options
    compiler_.apply(new NodeTemplate(htmlOptions));
    compiler_.apply(new LibraryTemplate(null, 'commonjs2'));
    compiler_.apply(new NodeTargetPlugin());
    compiler_.apply(new SingleEntry(context, entry, self.name));
    compiler_.apply(new LimitChunkCount({maxChunks: 1}));

    compiler_.plugin('this-compilation', (compilation, params) => {
      compilation.mainTemplate.plugin('asset-path', (path, data) => {
        if (path === '[name].html') {
          data.url = self.url
        }
        return path;
      })
      params.normalModuleFactory.plugin('parser', (parser) => {
        parser.plugin('call include', function (expr) {
          if (!expr.arguments[0]) throw new Error('include()');

          var param = this.evaluateExpression(expr.arguments[0]);
          var requireUrl = `!!${loader}!${utils.urlToRequest(param.string)}`;

          expr.arguments[0].value = requireUrl;
          expr.arguments[0].raw = JSON.stringify(requireUrl);
          return this.applyPluginsBailResult1('call require', expr);
        });
      });
    });

    compiler_.runAsChild((err, entries) => {
      outputName = entries[0].files[0];
      this.isCached = this.hash === entries[0].hash;
      this.hash = entries[0].hash;
      callback(err);
    });
  });

  compiler.plugin('emit', (compilation, callback) => {
    var cssAsset = [];
    var source = compilation.assets[outputName];
    var fileAssets = {_parentChunnkMap: {}, _parentChunnks: [], _chunkMap: {}};

    try {
      source = evaluate(source.source());
    } catch (err) {
      source = templateError.replace('_error_', err);
      compilation.errors.push(`${err} ${self.entry}`);
    }

    var mainTemplate = compilation.mainTemplate;
    var chunks = compilation.getStats().toJson().chunks;
    var publicPath = mainTemplate.getPublicPath({hash: compilation.hash});

    var genLink = (c) => `<link href="${publicPath + c}" rel="stylesheet">`;

    const resolvePChunk = (chunk, list) => {
      chunk.parents && chunk.parents.forEach((pid) => {
        var pChunk = _.isObject(pid) ? pid : fileAssets._chunkMap[pid];
        if (!~list.indexOf(pChunk.files[0]) && !~fileAssets._parentChunnks.indexOf(pChunk.files[0])) {
          fileAssets._parentChunnks.push(pChunk.files[0]);
          list.push(pChunk.files[0]);
        }
        resolvePChunk(pChunk, list);
      })
    }

    chunks.forEach((chunk) => {
      fileAssets._chunkMap[chunk.id] = chunk;
      chunk.names[0] && (fileAssets[chunk.names[0]] = chunk);
    });

    source = source.replace(scrptExpr, (match, src) => {
      var name = getEntryName(src);
      var fileChunk = fileAssets[name];
      var parentChunks = fileAssets._parentChunnkMap[src] = [];

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
      var typeArr = type.split('!');
      var genScript = (s) => `<script src="${publicPath + s}"${typeArr[2]}></script>`;

      switch (typeArr[0]) {
        case 'css_inject':
        case 'css_inject_h':
          return cssAsset.map(genLink).join(`\r\n${src}`);

        case 'script_inject':
          var inject = fileAssets._parentChunnkMap[typeArr[1]];
          if (inject && inject.length) {
            inject.reverse();
            return `${inject.map(genScript).join(`\r\n${src}`)}\r\n${src}`;
          }
          break;
      }
      return '';
    });

    source = compilation.applyPluginsWaterfall('html-webpack-plugin-before-emit', source)
    compilation.assets[outputName] = new RawSource(source);
    compilation.applyPluginsAsyncWaterfall('html-webpack-plugin-after-emit',
      {name: outputName, isCached: self.isCached}, () => {})
    callback(null);
  });

  function evaluate(source) {
    var script = new vm.Script(source);
    var context = new vm.createContext(imports);
    var newSource = script.runInContext(context);

    if (_.isString(newSource.default)) newSource = newSource.default
    if (!newSource) throw new Error(`can't evaluate empty html file:`)

    return newSource;
  }

  function getEntryName(src) {
    var assets = self.easepack.assets;
    var filePath = Path.join(context, self.entry, '..', src);
    var entry = Path.relative(context, filePath).replace(/\\|\//g, '/');
    return (assets[entry] || {}).name;
  }
};
