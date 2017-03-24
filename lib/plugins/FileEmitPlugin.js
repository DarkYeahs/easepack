var path = require('path');
var loaderUtils = require("loader-utils");
var RawSource = require("webpack-sources").RawSource;

var extExpr = /\.(\w+)$/;

function FileEmitPlugin(props, file) {
  this.file = file;
  this.name = props.name;
  this.url = props.url || file;
}

module.exports = FileEmitPlugin;

FileEmitPlugin.prototype.apply = function (compiler) {
  var self = this;
  var ext = (extExpr.exec(this.file) || [])[1];
  var inputFileSystem = compiler.inputFileSystem;
  var realPath = path.join(compiler.options.context, self.file);

  self.url = self.url.replace('[ext]', ext || '');

  compiler.plugin('emit', function (compilation, callback) {
    var template = compilation.mainTemplate;
    var chunks = compilation.getStats().toJson().chunks;

    if (chunks.every(function (chunk) {
        return chunk.names[0] !== self.name
      })) {
      inputFileSystem.readFile(realPath, function (err, buffer) {
        if (err) return callback();

        var hash = loaderUtils.getHashDigest(buffer, null, null, 6);
        var assetPath = template.applyPluginsWaterfall('asset-path', self.url, {
          hash: hash, chunk: {name: self.name}
        });

        compilation.assets[assetPath] = new RawSource(buffer);
        callback();
      });
    } else {
      callback(new Error(''));
    }
  });
};