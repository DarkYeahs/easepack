var Webpack = require('webpack');
var Compiler = require('../Compiler');

function AssetPathPlugin(compiler) {
  this.compiler = compiler;
  this.jsAssetPath = {ext: 'js', 'hash': '[hash:6]'};
  this.cssAssetPath = {ext: 'css', 'hash': '[contenthash:6]'};

  compiler.config.plugins.push(new Webpack.LoaderOptionsPlugin({
    test: Compiler.IMAGE_EXT_REG,
    options: {
      context: compiler.context,
      customInterpolateName: _customInterpolateName
    }
  }));

  function _customInterpolateName(url) {
    var urlArgs = url.split('|');
    var filename = urlArgs[0] + '.' + urlArgs[1];

    var _options = {ext: urlArgs[1], name: urlArgs[0], hash: urlArgs[2]};
    var _props = compiler.assets[filename];

    if (_props && _props.url) {
      return _props.url.replace(/\[(.*?)\]/g, function () {
        return _options[arguments[1]] || arguments[1];
      });
    }
    return filename;
  }
}

module.exports = AssetPathPlugin;

AssetPathPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;
  var fileUrls = {};
  var extHashExpr = /\[(ext|hash)\]/g;

  Object.keys(self.compiler.assets).forEach(function (key) {
    var props = self.compiler.assets[key];
    fileUrls[props.name] = props.url;
  });

  webpackCompiler.plugin('this-compilation', function (compilation) {
    compilation.mainTemplate.plugin('asset-path', function (path, data) {
      if (data.chunk) {
        var url = fileUrls[data.chunk.name];
        var assetPath;

        switch (path) {
          case '[name].css':
            assetPath = self.cssAssetPath;
            break;
          case '[name].js':
            assetPath = self.jsAssetPath;
            break;
        }
        if (url) {
          path = url.replace(extHashExpr, function (match, key) {
            return assetPath[key] || match;
          });
        }
      }
      return path;
    })
  });
};