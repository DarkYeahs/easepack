var _ = require('lodash')
var path = require('path');
var Minimatch = require('minimatch').Minimatch;

var _config = module.exports = new Config();

function Config() {
  this.context = path.resolve('.');
  this.alias = {};
  this.matches = [];
  this.plugins = [];
  this.touched = {};

  // default options
  this.output = null;
  this.publicPath = '/';
  this.nodeEnv = '"development"';
  this.proxyTable = {};
  this.dev = false;
  this.screwIe8 = true;
  this.webpackDevServer = false;
  this.filename = {
    chunk: '_c_/[name].chunk.js?[chunkhash:6]'
  }

  this.autoRsync = false;
  this.rsyncMsg = false;

  this.useBase64 = '2kb';
  this.spriteUrl = false
  this.useCleancss = false;
  this.useAutoprefixer = false;
  this.useImagemin = false;
  this.useUglifyjs = false;
  this.useEs2015 = false;
  this.useCommonsChunk = false;

  this.useExtract = true;
  this.useSourceMap = false;
  this.mocha = false;
  this.upToDate = false;
  this.banner = '';
  this.privateRepo = false;

  this.port = 8080;
}

Config.prototype.match = function (pattern, props) {
  var mps = new MatchProps(this);
  Object.assign(mps.props, props || {});
  this.matches.push({
    minimatch: new Minimatch(pattern, {}),
    pattern: pattern,
    props: mps.props
  });
  return mps;
};

Config.prototype.matchProps = function (file) {
  const props = {}
  this.matches.forEach(match => {
    if (match.minimatch.match(file)) {
      Object.assign(props, match.props)
    }
  })
  return props
}

Config.prototype.setIfUndefined = function (key, value) {
  if (typeof key === 'string') {
    if (!this.touched[key]) {
      this.set(key, value);
    }
  } else if (typeof key === 'object') {
    Object.keys(key).forEach(function (k) {
      this.setIfUndefined(k, key[k]);
    }, this);
  }
  return this;
};

Config.prototype.set = function (key, value) {
  if (typeof key === 'string') {
    if (typeof this[key] === 'undefined') {
      throw new Error(`Try to set a undefined config key '${key}'`);
    }
    if (_.isPlainObject(this[key])) {
      value = Object.assign(this[key], value)
    }
    if (key === 'context' && !path.isAbsolute(value)) {
      value = path.resolve(value)
    }
    this[key] = value;
    this.touched[key] = true;
  } else if (typeof key === 'object') {
    Object.keys(key).forEach(function (k) {
      this.set(k, key[k]);
    }, this)
  }
  return this;
};

Config.prototype.media = function (media, value) {
  var config = media !== _config._media
    ? new Config()
    : _config
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

MatchProps.prototype.within = function (type, props) {
  var key = `_${type}_`;
  this.props[key] = Object.assign({}, this.props[key], props);
  return this;
};

['set', 'match'].forEach(function (key) {
  MatchProps.prototype[key] = function () {
    return this.config[key].apply(this.config, arguments);
  }
});
