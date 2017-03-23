var os = require('os');

function NetworkInfoPlugin(compiler) {
  this.compiler = compiler;
}

module.exports = NetworkInfoPlugin;

NetworkInfoPlugin.prototype.apply = function (webpackCompiler) {
  var compiler = this.compiler;
  var network = os.networkInterfaces();
  var networkKeys = Object.keys(network);

  webpackCompiler.plugin('before-this-compile', function (callback) {
    networkKeys.forEach(function (key, idx) {
      if (idx == networkKeys.length - 1) callback();

      network[key].forEach(function (na) {
        if (na.family == 'IPv4' && na.address !== '127.0.0.1') {
          compiler.options.ipv4 = na.address;
        }
      });
    });
  });
};
