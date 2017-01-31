var Complier = require('./lib/compiler');

module.exports = function (options) {
  var complier = new Complier(options);
  return complier;
};