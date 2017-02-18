var sass = require('node-sass');

function SassOptionsPlugin(options) {
  this.options = options;
}

module.exports = SassOptionsPlugin;

SassOptionsPlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', function (compilation) {
    compilation.options.sassLoader = {
      functions: {
        'headings($from: 0, $to: 6)': function (from, to) {
          var i, f = from.getValue(), t = to.getValue(),
            list = new sass.types.List(t - f + 1);

          for (i = f; i <= t; i++) {
            list.setValue(i - f, new sass.types.String('h' + i));
          }
          return list;
        }
      }
    };
  });
};