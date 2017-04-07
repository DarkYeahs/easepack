var Parser = require('fastparse');
var loaderUtils = require('loader-utils');

var imageExpr = /<!--@img@(.*?)@-->/gi;

var parser = new Parser({
  inside: {
    '>': 'outside',
    '(\\ssrc=")(.*?)"' () {
      var val = arguments[2];
      var idx = arguments[3];
      var until = arguments[1];

      this.push({
        val: val,
        len: val.length,
        start: idx + until.length,
        type: this.currentTag
      });
    }
  },
  outside: {
    '<!--[\\s\\S]*?-->': true,
    '<\\/head>' () {
      this.push({
        type: 'inject',
        start: arguments[1],
        inject: 'css_inject',
        indent: this.preIndent
      });
    },
    '(?:\\r|\\n)+(\\s*)' () {
      this.preIndent = this.indent;
      this.indent = arguments[1];
    },
    '<(script|img)(?=\\s+)' () {
      this.currentTag = arguments[1];
      return 'inside';
    }
  }
});

module.exports = function (source) {
  this.cacheable && this.cacheable();

  var res = parser.parse('outside', source, []);
  var content = [source];

  res.reverse();
  res.forEach((loc) => {
    if (loc.val && !loaderUtils.isUrlRequest(loc.val))
      return;
    var idt = loc.indent;
    var last = content.pop();
    content.push(last.substr(loc.start + (loc.len || 0)));

    switch (loc.type) {
      case 'inject':
        content.push(`${idt}<!--@${loc.inject}@${idt}@-->\r\n`);
        content.push(last.substr(0, loc.start));
        break;

      case 'img':
      case 'script':
        content.push(`<!--@${loc.type}@${loc.val}@-->`);
        content.push(last.substr(0, loc.start));
        break;
    }
  });

  content.reverse();
  content = JSON.stringify(content.join(''));
  content = content.replace(imageExpr, (m, url) =>
    `"+require(${JSON.stringify(loaderUtils.urlToRequest(url))})+"`);

  return `exports.default=${content}`;
};