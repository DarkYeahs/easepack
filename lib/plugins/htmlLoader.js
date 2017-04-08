var Parser = require('fastparse');
var loaderUtils = require('loader-utils');

var imageExpr = /<!--@img@(.*?)@-->/gi;

var parser = new Parser({
  inside: {
    '>': 'outside',
    '(\\ssrc=")(.*?)"'() {
      var val = arguments[2];
      var idx = arguments[3];
      var until = arguments[1];

      this.loc.push({
        val: val,
        len: val.length,
        start: idx + until.length,
        type: this.currentTag
      });
    }
  },
  outside: {
    '<\\/head>'() {
      this.loc.push({
        type: 'inject',
        start: arguments[1],
        inject: 'css_inject',
        indent: this.preIndent
      });
    },
    '(?:\\r|\\n)+(\\s*)'() {
      this.preIndent = this.indent;
      this.indent = arguments[1];
    },
    '<(script|img)(?=\\s+)'() {
      this.currentTag = arguments[1];
      return 'inside';
    },
    '<!--([\\s\\S]*?)-->'(m, cmt, idx) {
      if (cmt.trim() == 'inject_css') {
        this.injectCss = true;
        this.loc.push({
          start: idx + 4,
          len: cmt.length,
          type: 'replace',
          content: `@css_inject@${this.indent}@`
        });
      }
    },
  }
});

module.exports = function (source) {
  this.cacheable && this.cacheable();

  var res = {loc: []};
  var content = [source];

  parser.parse('outside', source, res);

  res.loc.reverse();
  res.loc.forEach((loc) => {
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

      case 'replace':
        content.push(loc.content);
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