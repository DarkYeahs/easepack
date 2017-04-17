var Parser = require('fastparse');
var loaderUtils = require('loader-utils');
var _template = require('lodash/template');

var imageExpr = /<!--@img@(.*?)@-->/gi;
var delimitersExpr = /<%([\s\S]+?)%>/g;

var parser = new Parser({
  inside: {
    '>': 'outside',
    '(\\ssrc=")(.*?)"'(m, u, v, i) {
      this.loc.push({
        val: v,
        len: v.length,
        start: i + u.length,
        type: this.currentTag
      });
    }
  },
  outside: {
    '<\\/head>'() {
      this.loc.push({
        type: 'inject',
        start: arguments[1],
        inject: 'css_inject_h',
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
    '<!--((?!\\[if)[\\s\\S]*?)-->'(m, c, i) {
      if (c.trim() == 'inject_css') {
        this.injectCss = true;
        this.loc.push({
          start: i + 4,
          len: c.length,
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
    if (res.injectCss && 
      loc.inject == 'css_inject_h') {
      return;
    }
    if (loc.val && 
      delimitersExpr.test(loc.val) &&
      !loaderUtils.isUrlRequest(loc.val)) {
      return;
    }

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
  content = content.join('').replace(imageExpr, (m, url) => {
    return `<%=require(${JSON.stringify(loaderUtils.urlToRequest(url))})%>`;
  });
  
  return `exports.default = (${_template(content, {variable: 'd'}).source})();`;
};