var path = require('path');
var _config = module.exports = new Config();

function Config() {
  this.context = path.resolve('.');
  this.alias = {};
  this.matches = [];
  this.plugins = [];
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
    Object.keys(key).forEach(function (k) {
      this.set.call(this, k, key[k]);
    }, this)
  }
  return this;
};

Config.prototype.setIfUndefined = function (key) {
  if (typeof key === 'string') {
    if (this[key] === undefined) {
      this.set.apply(this, arguments);
    }
  } else if (typeof key === 'object') {
    Object.keys(key).forEach(function (k) {
      this.setIfUndefined.call(this, k, key[k]);
    }, this);
  }
  return this;
};

Config.prototype.media = function (media, value) {
  var config = media !== _config._media ?
    new Config() :
    _config;
  if (~media.indexOf(',')) {
    throw new Error('media key contains an invalid character `,`');
  }
  if (typeof value === 'object') {
    config.set(value);
  }
  return config;
};

Config.prototype.addPlugin = function (plugin) {
  this.plugins.push(plugin);
  return this;
};

//
function MatchProps(config) {
  this.config = config;
  this.props = {};
}

MatchProps.prototype.media = function (media, props) {
  if (this.config._media === media) {
    Object.assign(this.props, props || {});
  }
  return this;
};

['set', 'match'].forEach(function (key) {
  MatchProps.prototype[key] = function () {
    return this.config[key].apply(this.config, arguments);
  }
});
