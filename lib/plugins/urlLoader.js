var path = require('path');
var fileLoader = require('file-loader');
var querystring = require('querystring');
var loaderUtils = require('loader-utils');

var types = {jpg: 'jpeg', svg: 'svg+xml'};

var mimeTypes = function (ext) {
  if (/\.(png|gif|jpe?g|svg)$/i.test(ext)) {
    return 'image/' + (types[RegExp.$1] || RegExp.$1);
  }
};

module.exports = function (content) {
  this.cacheable && this.cacheable();

  var limit = 0;
  var inline = false;
  var options = this.options;
  var mimetype = mimeTypes(path.extname(this.resourcePath));

  if (this.resourceQuery) {
    var query = querystring.parse(this.resourceQuery.substr(1));
    inline = query.__inline !== 'undefined';
  }

  if (options.dataUrlLimit && mimetype) {
    switch (typeof options.dataUrlLimit) {
      case 'boolean':
        limit = Number.MAX_VALUE;
        break;
      case 'number':
        limit = options.dataUrlLimit;
        break;
      default :
        this.emitError('unknown dataUrlLimit value `' + options.dataUrlLimit + '`');
    }
    if (limit > content.length || inline) {
      return "module.exports = " + JSON.stringify('data:'
          + mimetype + ';base64,' + content.toString('base64'));
    }
  }
  return fileLoader.apply(this, arguments);
};

module.exports.raw = true;