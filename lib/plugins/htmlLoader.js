var Parser = require('fastparse');
var loaderUtils = require("loader-utils");

var parser = new Parser({
  outside: {
    '<!--([\\s\\S]+?)-->': true,
    '<(script|img)\\s*': function (match, tagName) {
      this.currentTag = tagName;
      return 'inside';
    }
  },
  inside: {
    '\\s+': true, // eat up whitespace
    '>': 'outside', // end of attributes
    '(src\\s*=\\s*\")(.*?)\"': function (match, untilVal, val, idx) {
      this.loc.push({
        tag: this.currentTag,
        start: idx + untilVal.length,
        length: val.length,
        value: val
      });
    }
  }
});

module.exports = function (source) {
  this.cacheable && this.cacheable();

  var result = parser.parse('outside', source, {loc: []});
  var content = [source];

  result.loc.reverse();
  result.loc.forEach(function (loc) {
    if (!loaderUtils.isUrlRequest(loc.value))
      return;
    var x = content.pop();
    content.push(x.substr(loc.start + loc.length));
    content.push('<!--@@' + tag2comment(loc.tag) + '@@' + loc.value + '@@-->');
    content.push(x.substr(0, loc.start));
  });

  content.reverse();
  content = JSON.stringify(content.join(''));

  return 'exports.default = ' +
    content.replace(/<!--@@EP_IMG@@(.*?)@@-->/g, function (match, url) {
      return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(url)) + ') + "';
    }) + ';';
};

function tag2comment(tag) {
  switch (tag) {
    case 'img':
      return 'EP_IMG';
    case 'script':
      return 'EP_SCR';
    default :
      return '';
  }
}