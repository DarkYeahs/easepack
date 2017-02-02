var rawEasepackLoader = require('./rawEasepackLoader');

var extractExpr = /<!--[\d\D]*?-->|<(link|script)([\d\D]*?)><\/\1>/g;

function HtmlWebpackPlugin(compiler, name) {
  this.name = name;
  this.compiler = compiler;
}

module.exports = HtmlWebpackPlugin;

HtmlWebpackPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;

  this.request = rawEasepackLoader.request(this.name, this.compiler.context);

  webpackCompiler.plugin('make', function (compilation, callback) {
    console.log(self)
    callback();
  });
};