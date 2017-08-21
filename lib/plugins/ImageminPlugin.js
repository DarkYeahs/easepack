var async = require('async');
var imagemin = require('imagemin');
var imageminPngquant = require('imagemin-pngquant');

var RawSource = require('webpack-sources').RawSource;
var ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers');

function ImageminPlugin(options) {
  this.options = options || {};
}

module.exports = ImageminPlugin;

ImageminPlugin.prototype.apply = function (compiler) {
  var options = this.options;
  options.test = options.test || /\.(png)(\?.*)?$/;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('optimize-chunk-assets', function (chunks, callback) {
      var files = Object.keys(compilation.assets);

      files.push.apply(files, compilation.additionalChunkAssets);
      files = files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, options));

      async.map(files, function (file, callback) {
        var asset = compilation.assets[file];
        if (asset.__ImageminPlugin) {
          compilation.assets[file] = asset.__ImageminPlugin;
          return callback();
        }
        imagemin.buffer(asset.source(), {
          use: [imageminPngquant()]
        }).then(function (data) {
          asset.__ImageminPlugin = compilation.assets[file] = new RawSource(data);
          callback();
        }).catch(function (err) {
          compilation.errors.push(new Error(file + ' from Imagemin\n' + err.stack));
          callback();
        });
      }, callback);
    });
  });
};
