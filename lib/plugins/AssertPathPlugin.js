function AssertPathPlugin(compiler) {
  this.compiler = compiler;
}

module.exports = AssertPathPlugin;

AssertPathPlugin.prototype.apply = function (webpackCompiler) {
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
        if (url) {
          switch (path) {
            case '[name].js':
              path = url.replace('[ext]', 'js');
              break;
            case '[name].css':
              path = url.replace('[ext]', 'css')
                .replace('[hash]', '[md5:contenthash:base64:6]');
              break;
          }
        }
      }
      if (data.hash) {
        data.hash = data.hash.substr(0, 6);
      }
      return path;
    })
  });
};