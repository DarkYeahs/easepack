var Complier = require('./lib/Compiler');

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
  return complier;
};