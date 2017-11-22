var path = require('path');
var loaderUtils = require('loader-utils');
var RawSource = require('webpack-sources').RawSource;

var extExpr = /\.(\w+)$/;

function FileEmitPlugin(props, file) {
  this.file = file;
  this.name = props.name;
  this.url = props.url || file;
}

module.exports = FileEmitPlugin;

FileEmitPlugin.prototype.apply = function (compiler) {
  var self = this;
  var context = compiler.options.context;
  var ext = (extExpr.exec(this.file) || [])[1];
  var inputFileSystem = compiler.inputFileSystem;
  var realPath = path.normalize(path.join(context, self.file));

  compiler.plugin('emit', function (compilation, callback) {
    var template = compilation.mainTemplate;
    if (
      compilation.modules.every(function (module) {
        return module.fileDependencies
          ? module.fileDependencies.every(file => file !== realPath)
          : true;
      })
    ) {
      console.log(realPath)
      inputFileSystem.readFile(realPath, function (err, buffer) {
        if (err) return callback(err);

        var hash = loaderUtils.getHashDigest(buffer, null, null, 6);
        var assetPath = template.applyPluginsWaterfall('asset-path', '[file-path]', {
          chunk: {name: self.name, hash: hash},
          assetPath: {ext: ext},
          url: self.url,
          hash: hash
        });

        compilation.assets[assetPath] = new RawSource(buffer);
        callback();
      });
    } else {
      callback();
    }
  });
};
