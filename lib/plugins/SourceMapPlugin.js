function SourceMapPlugin(comipler) {
  this.comipler = comipler;
  this.comipler.config.devtool = '#source-map';
}

module.exports = SourceMapPlugin;

SourceMapPlugin.prototype.apply = function (webpackCompiler) {
  webpackCompiler.options.vue = {sourceMap: true};
  webpackCompiler.options.sassLoader = {sourceMap: true};
  webpackCompiler.plugin('compilation', function (compilation) {
  });
};