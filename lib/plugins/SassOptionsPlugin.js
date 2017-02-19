var Glob = require('glob');
var Path = require('path');
var util = require('util');
var Layout = require('layout');
var Images = require('images');
var async = require('async');
var sass = require('node-sass');

var loaderUtils = require("loader-utils");
var RawSource = require('webpack/lib/RawSource');

function SassOptionsPlugin(options) {
  this._id = 0;
  this.assets = {};
  this.options = options;
}

module.exports = SassOptionsPlugin;

SassOptionsPlugin.prototype.apply = function (compiler) {
  var self = this;

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('normal-module-loader', function (loaderContext, module) {
      if (~module.userRequest.indexOf('sass-loader')) {
        loaderContext.options.sassLoader = {
          functions: {
            'sprite-map($pattern)': function (pattern, done) {
              self._getSpriteMapByPattern(pattern, compiler, compilation, function (err, id) {
                if (err) loaderContext.emitError(err);
                done(new sass.types.Number(id));
              });
            },
            'sprite($id, $key)': function (id, key, done) {
              var asset = self.assets[id.getValue()] || {'__sprite__': {}};
              var mate = asset[key.getValue()];
              if (!mate) {
                mate = {x: 0, y: 0};
                loaderContext.emitError(new Error('sprite($sprite-map, ' + key.getValue() + ')\n'));
              }
              done(new sass.types.String(util.format(
                'url(%s) -%spx -%spx', asset['__sprite__'].url, mate.x, mate.y)));
            },
            'sprite-width($id)': function (id, done) {
              var asset = self.assets[id.getValue()] || {};
              if (!asset['__sprite__']) {
                asset['__sprite__'] = {width: 0};
                loaderContext.emitError(new Error('sprite-width($sprite-map)\n'));
              }
              done(new sass.types.Number(asset['__sprite__'].width));
            },
            'sprite-height($id)': function (id, done) {
              var asset = self.assets[id.getValue()] || {};
              if (!asset['__sprite__']) {
                asset['__sprite__'] = {height: 0};
                loaderContext.emitError(new Error('sprite-height($sprite-map)\n'));
              }
              done(new sass.types.Number(asset['__sprite__'].height));
            },
            'sprite-position($id, $key)': function (id, done) {
              var asset = self.assets[id.getValue()] || {};
              if (!asset['__sprite__']) {
                asset['__sprite__'] = {width: 0};
                loaderContext.emitError(new Error('sprite-width($sprite-map)\n'));
              }
              done(new sass.types.Number(asset['__sprite__'].width));
            },
            'sprite-url($id)': function (id, done) {
              var asset = self.assets[id.getValue()] || {};
              if (!asset['__sprite__']) {
                asset['__sprite__'] = {url: '/not-found'};
                loaderContext.emitError(new Error('sprite-url($sprite-map)\n'));
              }
              done(new sass.types.Number(asset['__sprite__'].url));
            }
          }
        };
      }
    });
  });
};

SassOptionsPlugin.prototype._getSpriteMapByPattern = function (pattern, compiler, compilation, callback) {
  var self = this;
  var context = this.options.context;
  var spriteUrl = self.options.spriteUrl || '[name].png';
  var inputFileSystem = compiler.inputFileSystem;
  var _pattern = pattern.getValue(), spriteDir;

  if (/^([^\*]*?[^\/\*]+)\/\*\..*$/.test(_pattern)) {
    spriteDir = RegExp.$1;
  } else {
    return callback(new Error('$pattern format error : ' + _pattern + '\n'));
  }

  Glob(_pattern, {}, function (err, result) {
    if (err || !result.length) {
      return callback(err || new Error('image not found by $pattern : ' + _pattern + '\n'), 0);
    }
    async.map(result, function (file, callabck) {
      inputFileSystem.readFile(Path.join(context, file), function (err, buffer) {
        callabck(err, [file, buffer]);
      });
    }, function (err, files) {
      if (err) return callback(err, 0);

      var id = ++self._id;
      var asset = self.assets[id] = {};
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
          chunk: {name: spriteDir, hash: spriteHash},
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
      callback(null, id);
    });
  });
};

SassOptionsPlugin.prototype._genSpriteLayout = function (files) {
  var layer = new Layout('binary-tree');
  files.forEach(function (file) {
    var image = Images(file[1]);
    var path = file[0];
    var meta = {
      image: image,
      actualWidth: image.width(),
      actualHeight: image.height(),
      name: Path.basename(path, Path.extname(path))
    };
    layer.addItem({
      width: meta.actualWidth,
      height: meta.actualHeight,
      meta: meta
    });
  });
  return layer['export']();
};