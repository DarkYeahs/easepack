import Parser from 'fastparse'
import loaderUtils from 'loader-utils'

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
        len: 0,
        type: 'inject',
        start: arguments[1],
        inject: 'css_inject',
        indent: this.preIndent
      })
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

  let res = parser.parse('outside', source, []);
  let content = [source];

  res.reverse();
  res.forEach((loc) => {
    if (loc.val && !loaderUtils.isUrlRequest(loc.val))
      return;
    let last = content.pop();
    content.push(last.substr(loc.start + loc.len));

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

  return 'exports.default = ' +
    content.replace(/<!--@EP_IMG@@(.*?)@@-->/g, function (match, url) {
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