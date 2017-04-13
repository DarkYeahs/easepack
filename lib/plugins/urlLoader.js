var path = require('path');
var fileLoader = require('file-loader');
var querystring = require('querystring');
var loaderUtils = require('loader-utils');

var AssetPathPlugin = require('./AssetPathPlugin');

const types = {jpg: 'jpeg', svg: 'svg+xml'};
const typeExpr = /\.(?:(png|gif|jpe?g|svg)|(woff2?|eot|ttf|otf))$/i;

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

  if (inline && !AssetPathPlugin.IMAGE_EXT_REG.test(this.resourcePath)) {
    return 'module.exports = ' + JSON.stringify(content.toString());
  }

  if (options.dataUrlLimit && mimetype
    && AssetPathPlugin.IMAGE_EXT_REG.test(this.resourcePath)) {
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

function mimeTypes (ext) {
  if (typeExpr.test(ext)) {
    return !RegExp.$1 ? 
      `application/octet-stream` :
      `image/${types[RegExp.$1] || RegExp.$1}`;
  }
};

module.exports.raw = true;
module.exports.mimeTypes = mimeTypes;