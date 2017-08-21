module.exports = function (content) {
  this.cacheable && this.cacheable();
  return '<style>' + content + '</style>';
};
