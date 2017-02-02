var Path = require('path');

var rel = module.exports = function () {
};

rel.request = function (request, context) {
  return require.resolve('./rawEasepackLoader.js') +
    '!' + Path.resolve(context, request);
};