const os = require('os');
const Path = require('path');

const tempDirName = '.easepack-temp';

function ResolveTempDirPlugin() {
}

module.exports = ResolveTempDirPlugin;

ResolveTempDirPlugin.prototype.apply = function (compiler) {
  var self = compiler;
  var options = compiler.options;

  compiler.plugin('configuration', (callback) => {
    options.tempPath = Path.join(os.tmpdir(), '..', tempDirName);
    options.tempWebPath = Path.join(options.tempPath, 'web');

    if (options.output
      && !Path.isAbsolute(options.output)) {
      options.output = Path.join(self.context, options.output);
    }
    if (options.privateRepo
      && !Path.isAbsolute(options.privateRepo)) {
      options.privateRepo = Path.join(self.context, options.privateRepo);
    }

    callback();
  });
};
