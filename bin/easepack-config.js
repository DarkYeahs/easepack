var path = require('path');
var _config = module.exports = new Config();

function MatchProps(config) {
  this.config = config;
  this.props = {};
}

function Config() {
  this.context = path.resolve('.');
  this.matches = [];
}

Config.prototype.match = function (pattern, props) {
  var mps = new MatchProps(this);
  Object.assign(mps.props, props);

  this.matches.push({
    pattern: pattern,
    props: mps.props
  });
  return mps;
};

Config.prototype.media = function (media) {
  return media !== this.media ?
    new Config() :
    _config;
};

