module.exports = function (source) {
  this.cacheable && this.cacheable();
  console.log(this.resourcePath)
  return source;
};
module.exports.seperable = true;