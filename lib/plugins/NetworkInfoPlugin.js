const os = require('os');

function NetworkInfoPlugin() {
}

module.exports = NetworkInfoPlugin;

NetworkInfoPlugin.prototype.apply = function (compiler) {
  var network = os.networkInterfaces();
  var networkKeys = Object.keys(network);

  compiler.plugin('configuration', (callback) => {
    networkKeys.forEach((key, idx) => {
      // 排除虚拟机的网络接口
      if (!/VirtualBox/ig.test(key) && !/Vmware/ig.test(key)) {
        if (idx === networkKeys.length - 1) callback();
        network[key].forEach((na) => {
          if (na.family === 'IPv4' && na.address !== '127.0.0.1') {
            compiler.options.ipv4 = na.address;
          }
        })
      }
    })
  });
};
