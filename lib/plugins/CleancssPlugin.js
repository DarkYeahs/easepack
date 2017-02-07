function CleancssPlugin(options) {
  this.options = options;
}

module.exports = CleancssPlugin;

CleancssPlugin.prototype.apply = function (compiler) {
  var self = this;
  var options = this.options;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext, module) {
      //console.log(Object.keys(module.rawRequest));
      console.log(module.rawRequest);
      console.log()
      //console.log(Object.keys(loaderContext._module));
      //loaderContext.minimize = true;
    });
  });
};