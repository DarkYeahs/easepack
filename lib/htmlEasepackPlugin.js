var fs = require('fs');
var Path = require('path');

//var linkExpr = /<!--[\d\D]*?-->|(\s*)<(script)\s.*?>([\d\D]*?)<\/\2>/g;
//var srcExpr = /src="(.*?)"/g;

function HtmlWebpackPlugin(compiler, name) {
  this.name = name;
  this.compiler = compiler;
  this.context = compiler.context;
}

module.exports = HtmlWebpackPlugin;

HtmlWebpackPlugin.prototype.apply = function (webpackCompiler) {
  //var self = this;
  //var htmlPath = Path.join(self.context, self.name);
  //
  //webpackCompiler.plugin('emit', function (compilation, callback) {
  //  fs.readFile(htmlPath, function (err, data) {
  //    var content = data.toString();
  //    var _content = content.replace(linkExpr, function (match, indent) {
  //      if (arguments[2]) {
  //        var cssExtract = false;
  //        var _match = match.replace(srcExpr, function (_match, src) {
  //          var chunks = compilation.getStats().toJson().chunks;
  //          console.log(chunks)
  //        });
  //      }
  //      return match;
  //    });
  //  });
  //});
};