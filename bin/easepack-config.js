var path = require('path');
var _config = module.exports = new Config();

function Config() {
  this.context = path.resolve('.');
  this.alias = {};
  this.matches = [];
}

Config.prototype.match = function (pattern, props) {
  var mps = new MatchProps(this);
  Object.assign(mps.props, props || {});

  this.matches.push({
    pattern: pattern,
    props: mps.props
  });
  return mps;
};

Config.prototype.set = function (key, value) {
  if (typeof key === 'string') {
    this[key] = value;
  } else if (typeof key === 'object') {
    Object.assign(this, key);
  }
  return this;
};

Config.prototype.media = function (media) {
  return media !== this.media ?
    new Config() :
    _config;
};

//
function MatchProps(config) {
  this.config = config;
  this.props = {};
}

MatchProps.prototype.media = function (media, props) {
  if (this.config.media === media) {
    Object.assign(this.props, props || {});
  }
  return this;
};

['set', 'match'].forEach(function (key) {
  MatchProps.prototype[key] = function () {
    return this.config[key].apply(this.config, arguments);
  }
});
