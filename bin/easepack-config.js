var path = require('path');
var _config = module.exports = new Config();

function MatchProps(config) {
  this.config = config;
  this.props = {};
}

MatchProps.prototype.media = function (media) {
  return this.config.media(media);
};

MatchProps.prototype.set = function () {
  return this.config.set.apply(this.config, arguments);
};

function Config() {
  this.context = path.resolve('.');
  this.alias = {};
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

Config.prototype.set = function (key, value) {
  this[key] = value;
  return this;
};

Config.prototype.media = function (media) {
  return media !== this.media ?
    new Config() :
    _config;
};

