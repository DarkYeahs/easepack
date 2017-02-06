var Complier = require('./lib/Compiler');

module.exports = function (options) {
  var complier = new Complier(options);
  return complier;
};