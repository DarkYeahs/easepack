var Webpack = require('webpack');
var exec = require('child_process').exec;

function AddBannerPlugin() {
}

module.exports = AddBannerPlugin;

AddBannerPlugin.prototype.apply = function (compiler) {
  var config = compiler.config;
  var options = compiler.options;

  compiler.plugin('configuration', (callback) => {
    if (options.banner) {
      config.plugins.push(new Webpack.BannerPlugin(options.banner));
      return callback();
    }
    exec('git config --get user.name', function (err, name) {
      if (!err && name) {
        config.plugins.push(new Webpack.BannerPlugin([
          compiler.context.substr(3).replace(/\\/g, '/'),
          name && JSON.stringify(name.toString().trim()).slice(1, -1)
        ].join(',')))
      }
      callback();
    });
  });
};
