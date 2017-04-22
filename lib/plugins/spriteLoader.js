const loaderUtils = require('loader-utils');

module.exports = function () {
  var query = loaderUtils.parseQuery(this.resourceQuery);
  return `module.exports = ${JSON.stringify(query.url)}`;
};