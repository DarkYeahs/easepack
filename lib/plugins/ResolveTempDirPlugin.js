const os = require('os');
const Path = require('path');
const loaderUtils = require("loader-utils");

const tempDirName = '.easepack-temp';
const repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/ep_components.git';

function ResolveTempDirPlugin() {
}

module.exports = ResolveTempDirPlugin;
module.exports.REPO_URL = repo;

ResolveTempDirPlugin.prototype.apply = function (compiler) {
  var config = compiler.config;
  var options = compiler.options;

  var hash = loaderUtils.getHashDigest(repo, null, null, 6);
  var hashWeb = loaderUtils.getHashDigest(compiler.context, null, null, 6);

  compiler.plugin('configuration', (callback) => {
    options.tempPath = Path.join(os.tmpdir(), '..', tempDirName);
    options.tempWebPath = Path.join(options.tempPath, `web${hashWeb}`);
    options.tempComponents = Path.join(options.tempPath, `components${hash}`);

    if (options.dev) {
      config.output.path = options.tempWebPath;
    }
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