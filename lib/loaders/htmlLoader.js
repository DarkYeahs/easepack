module.exports = function (source) {
  this.cacheable();
  console.log(this.request)
  console.log(this.query)
  console.log(this.resource)
  console.log(this.context)
  return '// remove by html loader';
};