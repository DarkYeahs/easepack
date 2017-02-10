var Path = require('path');
var Server = require('../Server');
var RawSource = require('webpack/lib/RawSource');

var scriptExpr = /(\s*)(?:<!--([\d\D]*?)-->|<(script)\s.*?>([\d\D]*?)<\/\3>)/g;

function HtmlWebpackPlugin(compiler, filename) {
  this.compiler = compiler;
  this.filename = filename;
  this.context = compiler.context;
}

module.exports = HtmlWebpackPlugin;

HtmlWebpackPlugin.prototype.apply = function (webpackCompiler) {
  var self = this;
  var inputFileSystem = webpackCompiler.inputFileSystem;
  var filepath = Path.normalize(Path.join(self.context, self.filename));

  self.filepath = filepath;

  webpackCompiler.plugin('emit', function (compilation, callback) {
    inputFileSystem.readFile(filepath, function (err, data) {
      var cssAssets = [''];
      var cssIndent = false;
      var cssPlaceholder = false;
      var chunks = compilation.getStats().toJson().chunks;

      var publicPath = compilation.mainTemplate.getPublicPath({
        hash: compilation.hash
      });

      var content = data.toString().replace(scriptExpr, function (match) {
        var indent = arguments[1];
        var attri = self._getAttributes(match);

        if (!arguments[3]) {
          cssIndent = indent;
          if (!cssPlaceholder) {
            cssPlaceholder = (arguments[2].trim() === 'inject_css') && match;
          }
          return match
        }
        if (self._isAbsolute(attri.src)) return match;

        var name = self._getEntryName(attri.src);
        chunks.every(function (chunk) {
          if (chunk.names[0] !== name)
            return true;

          match = chunk.files.filter(function (file) {
            if (/\.css($|\?)/.test(file)) {
              cssAssets.push(file);
              return false;
            }
            return true;
          }).map(function (file) {
            return self._generateTags(file, publicPath, match, attri.src);
          }).join('');

          return false;
        });
        return match;
      });

      if (cssPlaceholder) {
        content = content.replace(cssPlaceholder, cssAssets.map(function (file) {
          return self._generateTags(file, publicPath);
        }).join(cssIndent));
      }

      compilation.fileDependencies.push(filepath);
      compilation.assets[self.filename] = new RawSource(content);
      callback();
    });
  });
};

HtmlWebpackPlugin.prototype._generateTags = function (file, publicPath, match, src) {
  if (!file)
    return '';
  if (match) {
    return match.replace(src, publicPath + file);
  } else {
    return '<link rel="stylesheet" href="' + publicPath + file + '">';
  }
};

HtmlWebpackPlugin.prototype._getAttributes = function (str) {
  var attrExpr = /\s(\w+)\s*=('|")\s*(.*?)\s*\2/g;
  var attributes = {};
  var _exec;
  while ((_exec = attrExpr.exec(str))) {
    attributes[_exec[1]] = _exec[3];
  }
  return attributes;
};

HtmlWebpackPlugin.prototype._isAbsolute = function (path) {
  if (~path.indexOf('http://'))
    return true;
  return Path.isAbsolute(path);
};

HtmlWebpackPlugin.prototype._getEntryName = function (src) {
  var entry = Path.relative(Path.dirname(this.filepath), src).split(Path.sep).join('/');
  return entry.replace(/\.\w+$/, '');
};