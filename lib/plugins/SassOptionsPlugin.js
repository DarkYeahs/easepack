var Glob = require('glob');
var Path = require('path');
var util = require('util');
var Layout = require('layout');
var Images = require('images');
var async = require('async');
var sass = require('node-sass');

var utils = require('loader-utils');
var RawSource = require('webpack-sources').RawSource;

const _options = {};
const patternExpr = /^([^*]+)\/\*\..*$/;

module.exports = SassOptionsPlugin;
module.exports.Sprite = Sprite;
module.exports.patternExpr = patternExpr;

function SassOptionsPlugin(options, margin, rela) {
  this.assets = {};
  this.rela = !!rela;
  this.margin = margin || 0;
  this.options = Object.assign(_options, options);
}

SassOptionsPlugin.prototype.apply = function (compiler) {
  var self = this;
  compiler.plugin('compilation', function (compilation, params) {
    params.normalModuleFactory.plugin('parser', (parser) => {
      parser.plugin('call __sprite_map__', function (expr) {
        if (!expr.arguments[0]) throw new Error('__sprite_map__()');

        var param = this.evaluateExpression(expr.arguments[0]);
        var requireUrl = `sprite?pattern=${param.string}`;

        expr.arguments[0].value = requireUrl;
        expr.arguments[0].raw = JSON.stringify(requireUrl);
        return this.applyPluginsBailResult1('call require', expr);
      });
    });
    compilation.plugin('normal-module-loader', function (loaderContext, module) {
      if (!~module.userRequest.indexOf('sass-loader')) return;
      if (!loaderContext.options.sassLoader) loaderContext.options.sassLoader = {};

      loaderContext.options.sassLoader.functions = {
        'sprite-map($pattern, $layout:"binary-tree")': function (pattern, layout, done) {
          self._genSpriteMapByPattern(pattern.getValue(), loaderContext, layout.getValue(), function (err, id) {
            if (err) loaderContext.emitError(err);
            done(new sass.types.String(id));
          });
        },
        'sprite($map, $sprite)': function (map, sprite, done) {
          var _sprite = sprite.getValue();
          self._getSpriteMapByMap(map.getValue(), _sprite, function (err, sprite) {
            if (err) {
              loaderContext.emitError(err);
              return done(new sass.types.String('url(/) 0 0'));
            }
            var position = sprite.getPosition(_sprite);
            done(new sass.types.String(
              util.format('url(%s) -%spx -%spx', sprite.getUrl(), position.x, position.y)
            ));
          });
        },
        'sprite-width($map, $sprite:"")': function (map, sprite, done) {
          var _sprite = sprite.getValue();
          if (_sprite) {
            self._getSpriteMapByMap(map.getValue(), _sprite, _callback);
          } else {
            self._getSpriteMapByMap(map.getValue(), _callback);
          }
          function _callback(err, sprite) {
            if (err) loaderContext.emitError(err);
            done(new sass.types.Number(err ? 0 : sprite.getWidth(_sprite)));
          }
        },
        'sprite-height($map, $sprite:"")': function (map, sprite, done) {
          var _sprite = sprite.getValue();
          if (_sprite) {
            self._getSpriteMapByMap(map.getValue(), _sprite, _callback);
          } else {
            self._getSpriteMapByMap(map.getValue(), _callback);
          }
          function _callback(err, sprite) {
            if (err) loaderContext.emitError(err);
            done(new sass.types.Number(err ? 0 : sprite.getHeight(_sprite)));
          }
        },
        'sprite-position-x($map, $sprite)': function (map, sprite, done) {
          var _sprite = sprite.getValue();
          self._getSpriteMapByMap(map.getValue(), _sprite, function (err, sprite) {
            if (err) loaderContext.emitError(err);
            done(new sass.types.Number(err ? 0 : sprite.getPosition(_sprite).x));
          });
        },
        'sprite-position-y($map, $sprite)': function (map, sprite, done) {
          var _sprite = sprite.getValue();
          self._getSpriteMapByMap(map.getValue(), _sprite, function (err, sprite) {
            if (err) loaderContext.emitError(err);
            done(new sass.types.Number(err ? 0 : sprite.getPosition(_sprite).y));
          });
        },
        'sprite-names($map)': function (map, done) {
          self._getSpriteMapByMap(map.getValue(), function (err, sprite) {
            if (err) {
              loaderContext.emitError(err);
              return done(new sass.types.List(0));
            }
            var names = sprite.getNames();
            var list = new sass.types.List(names.length);
            names.forEach(function (name, index) {
              list.setValue(index, new sass.types.String(name));
            });
            done(list);
          });
        },
        'sprite-url($map)': function (map, done) {
          self._getSpriteMapByMap(map.getValue(), function (err, sprite) {
            if (err) loaderContext.emitError(err);
            done(new sass.types.String(util.format('url(%s)', err ? '/' : sprite.getUrl())));
          });
        }
      };
    });
  });
};

SassOptionsPlugin.prototype._getSpriteMapByMap = function (map, sprite, callback) {
  var meta
  var asset = this.assets[map];
  if (!asset) {
    return callback(new Error('variable `sprite-map("' + map + '")` not found\n'));
  }
  if (typeof sprite === 'function') {
    callback = sprite;
  } else {
    meta = asset[sprite];
    if (!meta) {
      return callback(new Error('name `' + sprite +
        '` not found in `sprite-map("' + map + '")`\n'));
    }
  }
  callback(null, new Sprite(asset, this.margin));
};

SassOptionsPlugin.prototype._glob = function (pattern, compiler, loaderContext, callback) {
  var context = this.options.context;
  var inputFileSystem = compiler.inputFileSystem;

  Glob(pattern, {cwd: context}, function (err, result) {
    if (err || !result.length) {
      return callback(err || new Error('image not found by $pattern : ' + pattern + '\n'), 0);
    }
    async.map(result, function (file, callabck) {
      var filePath = Path.normalize(Path.join(context, file));

      loaderContext.addDependency(filePath);
      inputFileSystem.readFile(filePath, function (err, buffer) {
        callabck(err, [
          file, buffer, utils.getHashDigest(buffer)
        ]);
      });
    }, callback);
  });
};

SassOptionsPlugin.prototype._resolveFromCache = function (pattern, layout, files) {
  var asset = this.assets[pattern] || {};
  var _layout = asset['__layout__'];
  var hashContext = asset['__hash_context__'];

  if (hashContext && hashContext.length === files.length &&
    _layout === layout && files.every(file => (hashContext[file[2]]))) {
    asset['__from_cache__'] = true;
  } else {
    asset = {
      __layout__: layout,
      __from_cache__: false
    };
    hashContext = asset['__hash_context__'] = {length: files.length};
    files.forEach(function (file) {
      hashContext[file[2]] = true;
    });
  }
  return asset;
};

SassOptionsPlugin.prototype._genSpriteMapByPattern = function (_pattern, loaderContext, _layout, callback) {
  var self = this;
  var spriteDir = null;
  var margin = this.margin;
  var compiler = loaderContext._compiler;
  var compilation = loaderContext._compilation;
  var spriteUrl = self.options.spriteUrl || '[path][name].png';

  if (patternExpr.test(_pattern)) {
    spriteDir = RegExp.$1;
  } else {
    return callback(new Error('$pattern format error : ' + _pattern + '\n'));
  }

  self._glob(_pattern, compiler, loaderContext, function (err, files) {
    if (err) return callback(err, _pattern);

    var asset = self._resolveFromCache(_pattern, _layout, files);
    if (asset['__from_cache__']) {
      return callback(null, _pattern);
    }
    self.assets[_pattern] = asset;

    var spriteLayout = self._genSpriteLayout(files, _layout);
    var spriteFile = Images(spriteLayout.width, spriteLayout.height);

    spriteLayout.items.forEach(function (item) {
      spriteFile.draw(item.image, item.x + margin, item.y + margin);
      asset[item.name] = item;
    });

    var spritePng = spriteFile.encode('png');
    var mainTemplate = compilation.mainTemplate;
    var spriteHash = utils.getHashDigest(spritePng, null, null, 6);
    var publicPath = mainTemplate.getPublicPath({hash: compilation.hash});

    var assetPath = mainTemplate.applyPluginsWaterfall('asset-path', '[file-path]', {
      chunk: {name: spriteDir, hash: spriteHash},
      assetPath: {ext: 'png'},
      hash: spriteHash,
      url: spriteUrl
    });
    var _url = publicPath + assetPath;
    if (utils.isUrlRequest(_url) && !self.rela) _url = `~sprite?url=${_url}`;

    asset['__sprite__'] = {url: _url, width: spriteLayout.width, height: spriteLayout.height};
    compilation.assets[assetPath] = new RawSource(spritePng);
    callback(null, _pattern);
  });
};

SassOptionsPlugin.prototype._genSpriteLayout = function (files, layout) {
  var margin2x = this.margin * 2;
  var layer = new Layout(layout || 'binary-tree');

  files.forEach(function (file) {
    var path = file[0];
    var buffer = file[1];
    var image = Images(buffer);

    var width = image.width();
    var height = image.height();

    layer.addItem({
      image: image,
      actualWidth: width,
      actualHeight: height,
      width: width + margin2x,
      height: height + margin2x,
      name: Path.basename(path, Path.extname(path))
    });
  });

  return layer['export']();
};

function Sprite(asset, margin) {
  this.asset = asset;
  this.margin = margin
}

Sprite.prototype.getUrl = function () {
  return this.asset['__sprite__'].url;
};

Sprite.prototype.getPosition = function (sprite) {
  return {
    x: this.asset[sprite].x + this.margin,
    y: this.asset[sprite].y + this.margin
  };
};

Sprite.prototype.getWidth = function (sprite) {
  if (sprite) {
    return this.asset[sprite].actualWidth;
  } else {
    return this.asset['__sprite__'].width;
  }
};

Sprite.prototype.getHeight = function (sprite) {
  if (sprite) {
    return this.asset[sprite].actualHeight;
  } else {
    return this.asset['__sprite__'].height;
  }
};

Sprite.prototype.getNames = function () {
  return Object.keys(this.asset).filter(function (name) {
    return !/^_(?:_[a-z]+)+__$/.test(name);
  });
};
