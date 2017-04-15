const os = require('os');
const Path = require('path');

const tempDirName = '.easepack-temp';

function ResolveTempDirPlugin() {
}

module.exports = ResolveTempDirPlugin;

ResolveTempDirPlugin.prototype.apply = function (compiler) {
  var config = compiler.config;
  var options = compiler.options;

  compiler.plugin('configuration', (callback) => {
    compiler.tempPath = Path.join(os.tmpdir(), '..', tempDirName);
    compiler.tempWebPath = Path.join(compiler.tempPath, 'web');

    if (config.output.path
      && !Path.isAbsolute(config.output.path)) {
      config.output.path = Path.join(compiler.context, config.output.path);
    }
    if (options.privateRepo
      && !Path.isAbsolute(options.privateRepo)) {
      options.privateRepo = Path.join(compiler.context, options.privateRepo);
    }
    callback();
  });
};
