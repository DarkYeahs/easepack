var Webpack = require('webpack');
var exec = require('child_process').exec;

function AddBannerPlugin(compiler) {
  this.compiler = compiler;
}

module.exports = AddBannerPlugin;

AddBannerPlugin.prototype.apply = function (webpackCompiler) {
  var compiler = this.compiler;

  webpackCompiler.plugin('before-this-compile', function (callback) {
    if (compiler.options.banner) {
      webpackCompiler.apply(new Webpack.BannerPlugin(compiler.options.banner));
      return callback();
    }
    exec('git config --get user.name', function (error, name) {
      webpackCompiler.apply(new Webpack.BannerPlugin([
        compiler.context.substr(3).replace(/\\/g, '/'),
        name && JSON.stringify(name.toString().trim()).slice(1, -1)
      ].join(',')));
      callback();
    });
  });
};
