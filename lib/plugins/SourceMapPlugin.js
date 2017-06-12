function SourceMapPlugin(comipler) {
  this.comipler = comipler;
  this.comipler.config.devtool = '#source-map';
}

module.exports = SourceMapPlugin;

SourceMapPlugin.prototype.apply = function (compiler) {
  if (!compiler.options.vue) compiler.options.vue = {};
  if (!compiler.options.sassLoader) compiler.options.sassLoader = {};

  compiler.options.vue.sourceMap = true;
  compiler.options.sassLoader.sourceMap = true;
};
