function AutoRsyncPlugin(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;

  compiler.options.output = this.options.autoRsync;
  compiler.config.output.path = this.options.autoRsync;
}

module.exports = AutoRsyncPlugin;

AutoRsyncPlugin.prototype.apply = function (compiler) {
  var options = this.options;

  compiler.plugin('after-emit', function (compilation, callback) {

    callback();
  });
};