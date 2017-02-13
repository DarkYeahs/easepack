var Parser = require('fastparse');

var parser = new Parser({
  outside: {
    '(\\s*)<!--([\\s\\S]+?)-->': function (indent, match, cmt, idx) {
      if (cmt.trim() == 'inject_css') {
        this.cssLoc.start = idx;
        this.cssLoc.end = idx + match.length;
        this.cssLoc.indent = indent;
      }
    },
    '(\\s*)<(?:script|img)\\s*': function (match, tagName) {
      console.log(arguments)
      console.log('==========')
      this.currentTag = tagName;
      return "inside";
    }
  },
  inside: {
    '\\s+': true, // eat up whitespace
    '>': "outside", // end of attributes
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'": processMatch,
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)": processMatch
  }
});

function processMatch(match, strUntilValue, name, value, index) {
  console.log(arguments)
};

module.exports = function (source) {
  this.cacheable && this.cacheable();
  parser.parse('outside', source, {
    cssLoc: {}
  });
  return '/*' + source + '*/';
};