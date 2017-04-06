import Parser from 'fastparse'
import loaderUtils from 'loader-utils'

const parser = new Parser({
  outside: {
    '<!--([\\s\\S]+?)-->': true,
    '<(?:script|img)(?=\\s+)' (match) {
      this.currentTag = match.substr(1);
      return 'inside';
    }
  },
  inside: {
    '>': 'outside',
    '(?:\\ssrc\\s*=\\s*")(.*?)"' (m, val, start) {
      this.loc.push({
        value: val,
        start: start,
        tag: this.currentTag
      });
    }
  }
});

export default (source) => {
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
}

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