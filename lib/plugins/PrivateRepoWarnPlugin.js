var Path = require('path');
var rawExpr = /^[^\\\/\.]+$/;

function PrivateRepoWarnPlugin(options) {
  this.options = options;
}

module.exports = PrivateRepoWarnPlugin;

PrivateRepoWarnPlugin.prototype.apply = function (compiler) {
  var dev = this.options.dev;
  var privateRepo = this.options.privateRepo;

  if (privateRepo && !dev) {
    privateRepo = Path.normalize(privateRepo);
    compiler.plugin('compilation', function (compilation) {
      compilation.plugin('normal-module-loader', function (loaderContext, module) {
        if (rawExpr.test(module.rawRequest) && ~module.request.indexOf(privateRepo)) {
          loaderContext.emitWarning('require a module `'
            + module.rawRequest + '` in private repository `' + privateRepo + '`');
        }
      });
    });
  }
};