var path = require('path');
var loaderUtils = require("loader-utils");

var extExpr = /\.(\w+)(?:\?.*)?$/;

function FileEmitPlugin(file, props) {
  this.file = file;
  this.props = props;
}

module.exports = FileEmitPlugin;

FileEmitPlugin.prototype.apply = function (compiler) {
  var self = this;
  var name = this.props.name;
  var inputFileSystem = compiler.inputFileSystem;
  var realPath = path.join(compiler.options.context, self.file);

  if (this.props.url) {
  }

  compiler.plugin('emit', function (compilation, callback) {
    var chunks = compilation.getStats().toJson().chunks;

    if (chunks.every(function (chunk) {
        return chunk.names[0] !== name
      })) {
      inputFileSystem.readFile(realPath, function (err, buffer) {
        if (err) return callback();
        var hash = loaderUtils.getHashDigest(buffer, null, null, 6);
        var assetPath = compilation.mainTemplate.applyPluginsWaterfall('asset-path');

      });
    }
  });
};

console.log(extExpr.exec('a.md?123'))