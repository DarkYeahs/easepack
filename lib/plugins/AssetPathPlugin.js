function AssertPathPlugin(compiler) {
  this.compiler = compiler;
  this.jsAssetPath = {ext: 'js', 'hash': '[hash:6]'};
  this.cssAssetPath = {ext: 'css', 'hash': '[contenthash:6]'};
}

module.exports = AssertPathPlugin;

AssertPathPlugin.prototype.apply = function (webpackCompiler) {
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