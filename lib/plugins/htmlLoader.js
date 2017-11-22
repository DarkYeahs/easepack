var path = require('path')
var Parser = require('fastparse');
var { isArray } = require('lodash');
var _template = require('lodash/template');
var {isUrlRequest, urlToRequest, slash} = require('loader-utils');
var urlLoader = require.resolve('./urlLoader')

const scriptTypeExpr = /\.(?:js)$/;

var imageExpr = /<!--§img§(.*?)§-->/gi;
var delimitersExpr = /\s*<%([\s\S]+?)%>\s*/g;

var parser = new Parser({
  inside: {
    '>': 'outside',
    '(\\ssrc=")(.*?)"'(m, u, v, i) {
      if (this.currentTag === 'script') {
        this.loc.push({
          type: 'inject_s',
          indent: this.indent,
          start: this.tagIndex,
          inject: `script_inject!${v}`
        })
      }
      this.loc.push({
        val: v,
        len: v.length,
        start: i + u.length,
        type: this.currentTag
      });
    }
  },
  outside: {
    '<%'() {
      return 'evaluate';
    },
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
    '<(script|img)(?=\\s+)'(m, t) {
      this.currentTag = t;
      this.tagIndex = arguments[2];
      return 'inside';
    },
    '<!--((?!\\[if)[\\s\\S]*?)-->'(m, c, i) {
      if (c.trim() === 'inject_css') {
        this.injectCss = true;
        this.loc.push({
          start: i + 4,
          len: c.length,
          type: 'replace',
          content: `§css_inject§${this.indent}§`
        });
      }
    }
  },
  evaluate: {
    '%>': 'outside',
    '\\binclude\\(.*?\\)'() {
    }
  }
});

module.exports = function (source) {
  this.cacheable && this.cacheable();
  if (!source) return `module.exports = ""`;

  var res = {loc: []};
  var content = [source];

  const isEntry = (src) => {
    if (!src || !src.trim() || !this.resource) {
      return true
    }
    const srcUrl = slash(path.join(this.resource, '..', src))
    const {entry, context} = this._compiler.parentOptions_
    for (let key in entry) {
      const entries = isArray(entry[key]) ? entry[key] : [entry[key]]
      if (!entries.every(url => slash(path.join(context, url)) !== srcUrl)) {
        return true
      }
    }
  }

  parser.parse('outside', source, res);

  res.loc.reverse();
  res.loc.forEach((loc) => {
    if (res.injectCss &&
      loc.inject === 'css_inject_h') {
      return;
    }
    if (loc.val &&
      (delimitersExpr.test(loc.val) || !isUrlRequest(loc.val))) {
      return;
    }

    var idt = loc.indent;
    var last = content.pop();

    content.push(last.substr(loc.start + (loc.len || 0)));

    switch (loc.type) {
      case 'replace':
        content.push(loc.content);
        content.push(last.substr(0, loc.start));
        break;

      case 'img':
      case 'script':
        if (loc.type === 'script' && !isEntry(loc.val)) {
          loc.type = 'img'
        }
        content.push(`<!--§${loc.type}§${loc.val}§-->`);
        content.push(last.substr(0, loc.start));
        break;

      case 'inject':
        content.push(`${idt}<!--§${loc.inject}§${idt}§-->\r\n`);
        content.push(last.substr(0, loc.start));
        break;

      case 'inject_s':
        content.push(`<!--§${loc.inject}§${idt}§-->`);
        content.push(last.substr(0, loc.start));
        break;
    }
  });

  content.reverse();
  content = content.join('').replace(imageExpr, (m, url) => {
    if (!url || !url.trim()) {
      return url;
    }
    let req = urlToRequest(url);
    if (scriptTypeExpr.test(url)) {
      req = `!!${urlLoader}?name=[path][name].[ext]!${req}`
    }
    return `<%=function(){
      try{
        return require(${JSON.stringify(req)})
      } catch(e){
        return ${JSON.stringify(url)}
      }
    }()%>`;
  });
  return `module.exports=(${
    _template(content, {variable: 'd'}).source
  })()`;
};
