import Parser from 'fastparse'
import loaderUtils from 'loader-utils'

const imageExpr = /<!--@img@(.*?)@-->/gi;

const parser = new Parser({
  inside: {
    '>': 'outside',
    '(\\ssrc=")(.*?)"' () {
      let val = arguments[2];
      let idx = arguments[3];
      let until = arguments[1];

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
      this.currentTag !== 'img' && this.push({
        type: 'inject',
        start: arguments[2],
        inject: 'script_inject',
        indent: this.preIndent
      });
      return 'inside';
    }
  }
});

module.exports = function (source) {
  this.cacheable && this.cacheable();

  let res = parser.parse('outside', source, []);
  let content = [source];

  res.reverse();
  res.forEach((loc) => {
    if (loc.val && !loaderUtils.isUrlRequest(loc.val))
      return;
    let last = content.pop();
    content.push(last.substr(loc.start + (loc.len || 0)));

    switch (loc.type) {
      case 'inject':
        content.push(`${loc.indent}<!--@${loc.inject}@@-->\r\n`);
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

  content = content.replace(imageExpr, (m, url) => {
    url = loaderUtils.urlToRequest(url);
    return `"+require(${JSON.stringify(url)})+"`;
  });

  return `exports.default=${content};`;
};