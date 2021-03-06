var utils = require('loader-utils')
var Stats = require('./lib/Stats');
var Complier = require('./lib/Compiler');

var AddBannerPlugin = require('./lib/plugins/AddBannerPlugin');
var EntryMatchPlugin = require('./lib/plugins/EntryMatchPlugin');
var NetworkInfoPlugin = require('./lib/plugins/NetworkInfoPlugin');
var ResolveAliasPlugin = require('./lib/plugins/ResolveAliasPlugin');
var ResolveTempDirPlugin = require('./lib/plugins/ResolveTempDirPlugin');

const CheckVersionPlugin = require('./lib/plugins/CheckVersionPlugin')

// Unix    => foo/bar
// Windows => foo/bar
utils.slash = require('./lib/utils/slash')

const easepack = module.exports = function (options) {
  // cost time log
  if (options.moreDetails) {
    Stats.normal('> Start building project...\n')
  }
  var complier = new Complier(options);
  complier.apply(new ResolveTempDirPlugin());
  complier.apply(new CheckVersionPlugin())
  complier.apply(new ResolveAliasPlugin());
  complier.apply(new NetworkInfoPlugin());
  complier.apply(new EntryMatchPlugin());
  complier.apply(new AddBannerPlugin());
  return complier;
}

const karma = easepack.karma = {}

exportPlugins(karma, 'preprocessor', './lib/karma/preprocessor')
exportPlugins(easepack, 'webpack', 'webpack')

function exportPlugins(obj, prop, name) {
  Object.defineProperty(obj, prop, {
    enumerable: true,
    configurable: false,
    get: () => require(name)
  })
}
