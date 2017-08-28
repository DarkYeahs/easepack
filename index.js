var utils = require('loader-utils')
var Complier = require('./lib/Compiler');

var AddBannerPlugin = require('./lib/plugins/AddBannerPlugin');
var EntryMatchPlugin = require('./lib/plugins/EntryMatchPlugin');
var NetworkInfoPlugin = require('./lib/plugins/NetworkInfoPlugin');
var ResolveAliasPlugin = require('./lib/plugins/ResolveAliasPlugin');
var ResolveTempDirPlugin = require('./lib/plugins/ResolveTempDirPlugin');


const easepack = module.exports = function (options) {
  var complier = new Complier(options);
  complier.apply(new ResolveTempDirPlugin());
  complier.apply(new ResolveAliasPlugin());
  complier.apply(new NetworkInfoPlugin());
  complier.apply(new EntryMatchPlugin());
  complier.apply(new AddBannerPlugin());
  return complier;
}

// Unix    => foo/bar
// Windows => foo/bar
utils.slash = function (input) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(input)
	const hasNonAscii = /[^\u0000-\u0080]+/.test(input)
	if (isExtendedLengthPath || hasNonAscii) {
		return input
	}
	return input.replace(/\\/g, '/')
}

const karma = easepack.karma = {}

exportPlugins(karma, 'preprocessor', './lib/plugins/karma/preprocessor')
exportPlugins(easepack, 'webpack', 'webpack')

function exportPlugins(obj, prop, name) {
  Object.defineProperty(obj, prop, {
    enumerable: true,
    configurable: false,
    get: () => require(name)
  })
}
