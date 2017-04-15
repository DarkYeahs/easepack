const async = require('async');

const versionExpr = /@(\d)$/;
const repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/ep_components.git';

function ResolveAliasPlugin() {
}

module.exports = ResolveAliasPlugin;

ResolveAliasPlugin.prototype.apply = function (compiler) {
  compiler.plugin('configuration', (callback) => {
    console.log(compiler.config)
    callback();
  });
};
