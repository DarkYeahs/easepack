var Path = require('path');
var Webpack = require('webpack');

function AssetPathPlugin(compiler) {
  this.compiler = compiler;
  this.jsAssetPath = {ext: 'js', hash: '[hash:6]'};
  this.cssAssetPath = {ext: 'css', hash: '[contenthash:6]'};

  var extHashExpr = this.extHashExpr = /\[(ext|hash|name)\]/g;
  var tempComponents = Path.normalize(compiler.options.tempComponents);
  var priTempComponents = Path.normalize(compiler.options.privateRepo || '');

  console.log(priTempComponents);

  compiler.config.plugins.push(new Webpack.LoaderOptionsPlugin({
    test: AssetPathPlugin.IMAGE_EXT_REG,
    options: {
      context: compiler.context,
      customInterpolateName: _customInterpolateName
    }
  }));

  function _customInterpolateName(url) {
    var urlArgs = url.split('|');
    var filename = urlArgs[0] + urlArgs[1];

    //console.log(filename)
    console.log(this.resourcePath)
    console.log(filename)
    //console.log(Object.keys(this))

    if (~this.resourcePath.indexOf(tempComponents)) {
      filename = '_components_' + filename.substr(tempComponents.length);
    } else if (~this.resourcePath.indexOf(priTempComponents)) {
      filename = '_components_' + filename.substr(priTempComponents.length);
    }

    var _options = {ext: urlArgs[1], name: urlArgs[0], hash: urlArgs[2]};
    var _props = compiler.assets[filename];

    if (_props && _props.url) {
      return _props.url.replace(extHashExpr, function (match, key) {
        return _options[key] || key;
      });
    }
    return filename;
  }
}

module.exports = AssetPathPlugin;
module.exports.IMAGE_EXT_REG = /\.(png|jpe?g|gif|svg)(\?.*)?$/;

AssetPathPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;
  var fileUrls = {};

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
          path = url.replace(self.extHashExpr, function (match, key) {
            return assetPath[key] || match;
          });
        }
      }
      return path;
    })
  });
};