var fs = require('fs');
var Path = require('path');

var linkExpr = /<!--[\d\D]*?-->|(\s*)<(script)\s.*?>([\d\D]*?)<\/\2>/g;
var propsExpr = /\[(name|hash)\]/g;
var srcExpr = /src="(.*?)"/g;

function HtmlWebpackPlugin(compiler, request) {
  this.request = request;
  this.compiler = compiler;
  this.context = compiler.context;
}

module.exports = HtmlWebpackPlugin;

HtmlWebpackPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;
  self.fullRequest = Path.join(self.context, self.request);

  webpackCompiler.plugin('emit', function (compilation, callback) {
    fs.readFile(self.fullRequest, function (err, data) {
      var content = data.toString();
      var chunks = compilation.getStats().toJson().chunks;

      var _content = content.replace(linkExpr, function (match, indent) {
        if (arguments[2]) {
          var jsUrl = '';
          var cssExtract = false;

          match = match.replace(srcExpr, function (_match, src) {
            var requestSrc = self._getSrcRequest(src);
            var requestProps = self.compiler.assets[requestSrc];
            var chunk = '';

            for (var i = 0, _chunk = chunks[i]; _chunk; i++) {
              if (_chunk.names[0] === requestProps.name) {
                chunk = _chunk;
                break;
              }
            }

            if (chunk) {
              chunk.name = requestProps.name;
              chunk.files.every(function (file) {
                if (Path.extname(file) == '.css') {
                  cssExtract = true;
                }
                return !cssExtract;
              });

              jsUrl = requestProps.url.replace(propsExpr, function () {
                return [chunk[arguments[1]]];
              });

              return _match.replace(src, jsUrl);
            } else {
              return _match;
            }
          });

          if (cssExtract) {
            match = indent + '<link rel="stylesheet" href="'+
              jsUrl.replace('.js', '.css') +'">' + match;
          }
        }
        return match;
      });

      compilation.fileDependencies.push(self.request);
      compilation.assets[self.request] = {
        source: function () {
          return _content;
        },
        size: function () {
          return _content.length;
        }
      };

      callback();
    });
  });
};

HtmlWebpackPlugin.prototype._getSrcRequest = function (src) {
  return Path.relative(Path.dirname(this.fullRequest), src).split(Path.sep).join('/');
};