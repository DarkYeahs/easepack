var Glob = require('glob');
var Path = require('path');
var util = require('util');
var Layout = require('layout');
var Images = require('images');
var async = require('async');
var sass = require('node-sass');

var loaderUtils = require("loader-utils");
var RawSource = require("webpack-sources").RawSource;

function SassOptionsPlugin(options) {
  this.assets = {};
  this.options = options;
}

function Sprite(asset) {
  this.asset = asset;
}

module.exports = SassOptionsPlugin;
module.exports.Sprite = Sprite;

SassOptionsPlugin.prototype.apply = function (compiler) {
  var self = this;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext, module) {
      if (~module.userRequest.indexOf('sass-loader')) {
        loaderContext.options.sassLoader = {
          functions: {
            'sprite-map($pattern)': function (pattern, done) {
              self._genSpriteMapByPattern(pattern, compiler, compilation, loaderContext, function (err, id) {
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
            }
          }
        };
      }
    });
  });
};

SassOptionsPlugin.prototype._getSpriteMapByMap = function (map, sprite, callback) {
  var asset = this.assets[map], meta;
  if (!asset)
    return callback(new Error('variable `sprite-map("' + map + '")` not found\n'));

  if (typeof sprite === 'function') {
    callback = sprite;
  } else {
    meta = asset[sprite];
    if (!meta)
      return callback(new Error('name `' + sprite +
        '` not found in `sprite-map("' + map + '")`\n'));
  }
  callback(null, new Sprite(asset));
};

SassOptionsPlugin.prototype._genSpriteMapByPattern = function (pattern, compiler, compilation, loaderContext, callback) {
  var self = this;
  var context = this.options.context;
  var spriteUrl = self.options.spriteUrl || '[name].png';
  var inputFileSystem = compiler.inputFileSystem;
  var _pattern = pattern.getValue(), spriteDir;

  if (/^([^\*]+)\/\*\..*$/.test(_pattern)) {
    spriteDir = RegExp.$1;
  } else {
    return callback(new Error('$pattern format error : ' + _pattern + '\n'));
  }

  Glob(_pattern, {}, function (err, result) {
    if (err || !result.length) {
      return callback(err || new Error('image not found by $pattern : ' + _pattern + '\n'), 0);
    }
    async.map(result, function (file, callabck) {
      var filePath = Path.normalize(Path.join(context, file));
      loaderContext.addDependency(filePath);
      inputFileSystem.readFile(filePath, function (err, buffer) {
        callabck(err, [file, buffer]);
      });
    }, function (err, files) {
      if (err) return callback(err, 0);

      var asset = self.assets[_pattern] = {};
      var spriteLayout = self._genSpriteLayout(files);
      var spriteFilePng = Images(spriteLayout.width, spriteLayout.height);

      spriteLayout.items.forEach(function (item) {
        spriteFilePng.draw(item.meta.image, item.x, item.y);
        asset[item.meta.name] = Object.assign(item.meta, {
          x: item.x, y: item.y
        });
      });

      var spriteFile = spriteFilePng.encode("png");
      var spriteHash = loaderUtils.getHashDigest(spriteFile, null, null, 6);

      var publicPath = compilation.mainTemplate.getPublicPath({
        hash: compilation.hash
      });

      var assetPath = compilation.mainTemplate.applyPluginsWaterfall(
        'asset-path', spriteUrl.replace('[ext]', 'png'), {
          chunk: {name: spriteDir, hash: spriteHash, id: _pattern},
          hash: spriteHash
        }
      );

      asset['__sprite__'] = {
        width: spriteLayout.width,
        height: spriteLayout.height,
        url: publicPath + assetPath,
        spriteDir: spriteLayout.spriteDir
      };

      compilation.assets[assetPath] = new RawSource(spriteFile);
      callback(null, _pattern);
    });
  });
};

SassOptionsPlugin.prototype._genSpriteLayout = function (files) {
  var layer = new Layout('binary-tree');

  files.forEach(function (file) {
    var path = file[0];
    var buffer = file[1];
    var image = Images(buffer);

    var meta = {
      image: image,
      actualWidth: image.width(),
      actualHeight: image.height(),
      name: Path.basename(path, Path.extname(path)),
      hash: loaderUtils.getHashDigest(buffer, null, null, 6)
    };

    layer.addItem({
      width: meta.actualWidth,
      height: meta.actualHeight,
      meta: meta
    });
  });

  return layer['export']();
};

Sprite.prototype.getUrl = function () {
  return this.asset['__sprite__'].url;
};

Sprite.prototype.getPosition = function (sprite) {
  return {
    x: this.asset[sprite].x,
    y: this.asset[sprite].y
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

Sprite.prototype.getNames = function (sprite) {
  return Object.keys(this.asset).filter(function (name) {
    return name !== '__sprite__';
  });
};