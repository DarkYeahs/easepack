var Path = require('path');
var Webpack = require('webpack');

function AssetPathPlugin(compiler) {
  this.compiler = compiler;
  this.jsAssetPath = {ext: 'js', hash: '[hash:6]'};
  this.cssAssetPath = {ext: 'css', hash: '[contenthash:6]'};

  var extHashExpr = this.extHashExpr = /\[(ext|hash|name)\]/g;
  var tempComponents = Path.normalize(compiler.options.tempComponents);
  var priTempComponents = Path.normalize(compiler.options.privateRepo || __dirname);

  compiler.config.plugins.push(new Webpack.LoaderOptionsPlugin({
    test: AssetPathPlugin.IMAGE_EXT_REG,
    options: {
      context: compiler.context,
      customInterpolateName: _customInterpolateName
    }
  }));

  function _customInterpolateName(url) {
    var componentDir;
    var urlArgs = url.split('|');
    var filename = urlArgs[0] + '.' + urlArgs[1];
    var fileUrl = (compiler.assets[filename] || {}).url;

    if (~this.resourcePath.indexOf(tempComponents)) {
      componentDir = tempComponents;
    } else if (~this.resourcePath.indexOf(priTempComponents)) {
      componentDir = priTempComponents.replace(/(\\|\/)$/, '');
    }

    if (componentDir) {
      fileUrl = compiler.options.dev ? '[name].[ext]' : '[name].[hash].[ext]';
      urlArgs[0] = '_components_' + this.resourcePath
          .substr(componentDir.length).replace(/\.\w+$/, '').replace(/\\|\//g, '/');
    }

    var options = {ext: urlArgs[1], name: urlArgs[0], hash: urlArgs[2]};

    if (fileUrl) {
      return fileUrl.replace(extHashExpr, function (match, key) {
        return options[key] || key;
      });
    }
    return filename;
  }
}

module.exports = AssetPathPlugin;
module.exports.IMAGE_EXT_REG = /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)(\?.*)?$/;

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
        var assetPath;
        var url = fileUrls[data.chunk.name];

        switch (path) {
          case '[name].css':
            assetPath = self.cssAssetPath;
            break;
          case '[name].js':
            assetPath = self.jsAssetPath;
            break;
        }

        if (url && assetPath) {
          path = url.replace(self.extHashExpr, function (match, key) {
            return assetPath[key] || match;
          });
        }
      }
      return path;
    })
  });
};