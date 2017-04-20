var Path = require('path');
var bytes = require('bytes');
var Webpack = require('webpack');

var jsExtExpr = /\.js$/;

function AssetPathPlugin(compiler) {
  this.compiler = compiler;
  this.htmlAssetPath = {ext: 'html', hash: ''};
  this.jsAssetPath = {ext: 'js', hash: '[chunkhash:6]'};
  this.cssAssetPath = {ext: 'css', hash: '[contenthash:6]'};

  var extHashExpr = this.extHashExpr = /\[(\w+)\]/g;
  var tempComponents = Path.normalize(compiler.options.tempComponents);
  var priTempComponents = Path.normalize(compiler.options.privateRepo || __dirname);

  var dataUrlLimit = compiler.options.useBase64;

  if (dataUrlLimit && (typeof dataUrlLimit == 'string')) {
    dataUrlLimit = bytes(dataUrlLimit);
  }

  compiler.config.plugins.push(new Webpack.LoaderOptionsPlugin({
    test: AssetPathPlugin.OTHER_EXT_REG,
    options: {
      context: compiler.context,
      dataUrlLimit: dataUrlLimit,
      customInterpolateName: _customInterpolateName
    }
  }));

  function _customInterpolateName(url) {
    var componentDir;
    var urlArgs = url.split('|');
    var filename = `${urlArgs[0]}${urlArgs[1]}.${urlArgs[2]}`;
    var fileUrl = (compiler.assets[filename] || {}).url;

    if (~this.resourcePath.indexOf(tempComponents)) {
      componentDir = tempComponents;
    } else if (~this.resourcePath.indexOf(priTempComponents)) {
      componentDir = priTempComponents.replace(/(\\|\/)$/, '');
    }

    if (componentDir) {
      fileUrl = '[name].[ext]?[hash]';
      urlArgs[1] = '_c_' + this.resourcePath
          .substr(componentDir.length).replace(/\.\w+$/, '').replace(/\\|\//g, '/');
    }

    var options = {ext: urlArgs[2], name: urlArgs[1], hash: urlArgs[3], path: urlArgs[0]};

    if (fileUrl) {
      return fileUrl.replace(extHashExpr, function (match, key) {
        return options[key] || '';
      });
    }
    return filename;
  }
}

module.exports = AssetPathPlugin;
module.exports.OTHER_EXT_REG = /\.(?!(js|s?css|sass|vue|html)(\?|$))\w+(\?.*)?$/;
module.exports.IMAGE_EXT_REG = /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)(\?.*)?$/;

AssetPathPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;
  var fileUrls = {};

  Object.keys(self.compiler.assets).forEach((key) => {
    var props = self.compiler.assets[key];
    jsExtExpr.test(key) && (fileUrls[props.name] = props);
  });

  webpackCompiler.plugin('compilation', (compilation) => {
    compilation.mainTemplate.plugin('asset-path', (path, data) => {
      if (data.chunk) {
        var assetPath;
        var pro = fileUrls[data.chunk.name] || {};
        var url = data.url || pro.url;

        switch (path) {
          case '[name].css':
            assetPath = self.cssAssetPath;
            url = (pro._css_ && pro._css_.url) || url;
            break;
          case '[name].js':
            assetPath = self.jsAssetPath;
            break;
          case '[name].html':
            assetPath = self.htmlAssetPath;
            break;
          case '[file-path]':
            assetPath = data.assetPath;
            break;
        }

        if (url && assetPath) {
          var cp = Path.dirname(data.chunk.name);

          assetPath.name = Path.basename(data.chunk.name);
          assetPath.path = (cp && cp !== '.') ? `${cp}/` : '';

          path = url.replace(self.extHashExpr, (match, key) => {
            return assetPath[key] === undefined ? match : assetPath[key];
          });
        }
      }
      return path;
    })
  });
};