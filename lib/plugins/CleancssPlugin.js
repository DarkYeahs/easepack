var async = require('async');
var cssnano = require('cssnano');

var RawSource = require("webpack-sources").RawSource;
var ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers');

function CleancssPlugin(options) {
  this.options = options;
}

module.exports = CleancssPlugin;

CleancssPlugin.prototype.apply = function (compiler) {
  var options = this.options;
  options.test = options.test || /\.css(\?.*)?$/;

  compiler.plugin('compilation', function (compilation) {
    //compilation.plugin('normal-module-loader', function (loaderContext, module) {
    //  if (~module.userRequest.indexOf('css-loader')) {
    //    loaderContext.minimize = true;
    //  }
    //});
    compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
      var files = Object.keys(compilation.assets);

      files.push.apply(files, compilation.additionalChunkAssets);
      files = files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, options));

      async.map(files, function (file, callback) {
        var asset = compilation.assets[file];
        if (asset.__CleancssPlugin) {
          compilation.assets[file] = asset.__CleancssPlugin;
          return;
        }

        cssnano.process(asset.source(), {
          autoprefixer: false,
          zindex: false,
          safe: true
        }).then(result => {
          var data = result.css;
          asset.__CleancssPlugin = compilation.assets[file] = new RawSource(data);
          callback();
        }).catch(function (err) {
          compilation.errors.push(new Error(file + " from CleancssPlugin\n" + err.stack));
          callback();
        });
      }, callback);
    });
  });
};