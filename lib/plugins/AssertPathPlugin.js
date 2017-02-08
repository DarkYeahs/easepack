function AssertPathPlugin(compiler) {
  this.compiler = compiler;
}

module.exports = AssertPathPlugin;

AssertPathPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;
  var fileNameMap = {};

  Object.keys(self.compiler.assets).forEach(function (key) {
    var props = self.compiler.assets[key];
    fileNameMap[props.name] = props.filename;
  });

  webpackCompiler.plugin('this-compilation', function (compilation) {
    compilation.mainTemplate.plugin('asset-path', function (path, data) {
      if (data.hash) {
        data.hash = data.hash.substr(0, 8);
      }
      if (data.chunk && data.chunk.name) {
        var _filename = fileNameMap[data.chunk.name];
        if (_filename) {
          if (path == '[name].js') {
            path = _filename;
          } else if (path == '[name].css') {
            path = _filename.replace('.js', '.css')
              .replace('[hash]', '[sha512:contenthash:base64:8]');
          }
        }
      }
      return path;
    })
  });
};