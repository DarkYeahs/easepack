var Complier = require('./lib/Compiler');

var AddBannerPlugin = require('./lib/plugins/AddBannerPlugin');
var EntryMatchPlugin = require('./lib/plugins/EntryMatchPlugin');
var NetworkInfoPlugin = require('./lib/plugins/NetworkInfoPlugin');
var ResolveAliasPlugin = require('./lib/plugins/ResolveAliasPlugin');
var ResolveTempDirPlugin = require('./lib/plugins/ResolveTempDirPlugin');

module.exports = function (options) {
  var complier = new Complier(options);
  complier.apply(new ResolveTempDirPlugin());
  complier.apply(new ResolveAliasPlugin());
  complier.apply(new NetworkInfoPlugin());
  complier.apply(new EntryMatchPlugin());
  complier.apply(new AddBannerPlugin());
  return complier;
};

module.exports.webpack = require('webpack');
