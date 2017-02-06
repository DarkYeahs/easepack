function CleancssPlguin(options) {
  this.options = options;
}

module.exports = CleancssPlguin;

CleancssPlguin.prototype.apply = function (compiler) {
  var self = this;
  var options = this.options;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('optimize-chunk-assets', function (chunks, callback) {
      console.log(compilation.assets)
      console.log('=-===')
      callback();
    })
  });
};