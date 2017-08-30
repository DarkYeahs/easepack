var Glob = require('glob');
var Path = require('path');
var Layout = require('layout');
var Images = require('images');
var async = require('async');
var sass = require('node-sass');
var utils = require('loader-utils');

const _options = {};
const patternExpr = /^([.~\w/][^*]+)\/\*\..*$/;

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
  compiler.plugin('this-compilation', function (compilation, params) {
    if (!compilation.options.sassLoader) {
      compilation.options.sassLoader = {}
    }
    compilation.options.sassLoader.functions = {
      'sprite($map, $sprite)' (map, sprite, done) {
        const _sprite = sprite.getValue()
        self._getSpriteMapByMap(map.getValue(), _sprite, (err, sprite) => {
          if (err) {
            compilation.errors.push(err)
            done(new sass.types.String('url(#) 0 0'))
          } else {
            const pos = sprite.getPosition(_sprite)
            done(new sass.types.String(`url(${sprite.getUrl()}) -${pos.x}px -${pos.y}px`))
          }
        })
      },
      'sprite-width($map, $sprite:"")' (map, sprite, done) {
        const _map = map.getValue()
        const _sprite = sprite.getValue()
        if (_sprite) {
          self._getSpriteMapByMap(_map, _sprite, _callback);
        } else {
          self._getSpriteMapByMap(_map, _callback);
        }
        function _callback(err, sprite) {
          if (err) compilation.errors.push(err)
          done(new sass.types.Number(err ? 0 : sprite.getWidth(_sprite)))
        }
      },
      'sprite-height($map, $sprite:"")' (map, sprite, done) {
        const _map = map.getValue()
        const _sprite = sprite.getValue()
        if (_sprite) {
          self._getSpriteMapByMap(_map, _sprite, _callback);
        } else {
          self._getSpriteMapByMap(_map, _callback);
        }
        function _callback(err, sprite) {
          if (err) compilation.errors.push(err)
          done(new sass.types.Number(err ? 0 : sprite.getHeight(_sprite)))
        }
      },
      'sprite-position-x($map, $sprite)' (map, sprite, done) {
        const _sprite = sprite.getValue();
        self._getSpriteMapByMap(map.getValue(), _sprite, function (err, sprite) {
          if (err) compilation.errors.push(err)
          done(new sass.types.Number(err ? 0 : sprite.getPosition(_sprite).x))
        });
      },
      'sprite-position-y($map, $sprite)' (map, sprite, done) {
        const _sprite = sprite.getValue()
        self._getSpriteMapByMap(map.getValue(), _sprite, (err, sprite) => {
          if (err) compilation.errors.push(err)
          done(new sass.types.Number(err ? 0 : sprite.getPosition(_sprite).y))
        });
      },
      'sprite-names($map)' (map, done) {
        self._getSpriteMapByMap(map.getValue(), (err, sprite) => {
          if (err) {
            compilation.errors.push(err)
            done(new sass.types.List(0))
          } else {
            const names = sprite.getNames()
            const list = new sass.types.List(names.length)
            names.map((name, idx) => list.setValue(idx, new sass.types.String(name)))
            done(list)
          }
        });
      },
      'sprite-url($map)' (map, done) {
        self._getSpriteMapByMap(map.getValue(), (err, sprite) => {
          if (err) compilation.errors.push(err)
          done(new sass.types.String(`url(${err ? '#' : sprite.getUrl()})`))
        })
      }
    }
    compilation.options.sassLoader.importer = function (url, prev, done) {
      const request = utils.urlToRequest(url, this.root)
      const dirContext = Path.dirname(Path.normalize(prev))
      if (!self.resolvePatternUrl(request, dirContext, compilation, (err, pattern, name) => {
        if (!err) {
          done({contents: `$${name}:sprite-map("${pattern}");$${name}-names:sprite-names($${name});`})
          return
        }
        done({file: url})
      })) {
        return null
      }
    }
    compilation.plugin('normal-module-loader', (loaderContext, module) => {
      if (!~module.userRequest.indexOf('sass-loader')) return;
      Object.assign(loaderContext.options.sassLoader.functions, {
        'sprite-map($pattern, $layout:"binary-tree")' (pattern, layout, done) {
          self._genSpriteMapByPattern(pattern.getValue(), layout.getValue(), loaderContext, (err, id) => {
            if (err) loaderContext.emitError(err)
            done(new sass.types.String(id))
          })
        }
      })
    })
    // __sprite_map__
    params.normalModuleFactory.plugin('parser', parser => {
      parser.plugin('call __sprite_map__', function (expr) {
        const args1 = expr.arguments[0]
        if (!args1) {
          throw new Error('__sprite_map__(undefined)')
        }
        var param = this.evaluateExpression(args1);
        var requireUrl = `sprite?pattern=${param.string}&context=${this.state.current.context}`;
        expr.arguments[0].value = requireUrl;
        expr.arguments[0].raw = JSON.stringify(requireUrl);
        return this.applyPluginsBailResult1('call require', expr);
      })
    })
  })
};

SassOptionsPlugin.prototype.resolvePatternUrl = function (request, dirContext, compilation, done) {
  if (patternExpr.test(request)) {
    const spriteDir = RegExp.$1
    compilation.resolvers.context.resolve({}, dirContext, spriteDir, (err, dir) => {
      if (!err) {
        const context = this.options.context
        const spriteName = Path.basename(spriteDir)
        const relativeDir = Path.relative(context, dir)
        const pattern = utils.slash(relativeDir + request.slice(spriteDir.length))
        done(null, pattern, spriteName)
        return
      }
      done(err)
    })
    return true
  } else {
    return false
  }
}

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
  var context = this.options.context
  var inputFileSystem = compiler.inputFileSystem;
  // if (!Path.isAbsolute(pattern)) {
  //   pattern = Path.join(this.options.context, pattern)
  // }
  Glob(pattern, {cwd: context}, function (err, result) {
    if (err || !result.length) {
      return callback(err || new Error('image not found by $pattern : ' + pattern + '\n'), 0);
    }
    async.map(result, function (file, callabck) {
      var filePath = Path.normalize(Path.join(context, file))
      // loaderContext.addDependency(filePath)
      inputFileSystem.readFile(filePath, function (err, buffer) {
        callabck(err, [file, buffer, utils.getHashDigest(buffer)])
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

SassOptionsPlugin.prototype._genSpriteMapByPattern = function (_pattern, _layout, loaderContext, callback) {
  var self = this;
  var margin = this.margin;
  var compiler = loaderContext._compiler;
  var compilation = loaderContext._compilation
  var spriteUrl = self.options.spriteUrl || '[path][name].png';

  if (patternExpr.test(_pattern)) {
    var spriteDir = RegExp.$1
    var fullSpriteDir = Path.normalize(Path.join(this.options.context, spriteDir))
  } else {
    return callback(new Error('$pattern format error : ' + _pattern + '\n'));
  }
  self._glob(_pattern, compiler, loaderContext, function (err, files) {
    if (err) return callback(err, _pattern);

    var asset = self._resolveFromCache(_pattern, _layout, files);
    loaderContext.addContextDependency(fullSpriteDir)
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
    // compilation.assets[assetPath] = new RawSource(spritePng);
    loaderContext.emitFile(assetPath, spritePng)
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
