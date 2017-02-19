function CleancssPlugin(options) {
  this.options = options;
}

module.exports = CleancssPlugin;

CleancssPlugin.prototype.apply = function (compiler) {
  //var self = this;
  //var options = this.options;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext, module) {
      if (~module.userRequest.indexOf('sass-loader')) {
        loaderContext.minimize = true;
      }
    });
  });
};