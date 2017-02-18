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
  var context = this.options.context;
  var inputFileSystem = compiler.inputFileSystem;

  var spriteUrl = self.options.spriteUrl || '[name].png';
  var spriteMargin = self.options.spriteMargin || 5;

  compiler.plugin('compilation', function (compilation) {
    self._id = 0;

    if (!compilation.options.sassLoader) {
      compilation.options.sassLoader = {
        functions: {
          'sprite($id, $file)': function (id, file, done) {
            var asset = self.assets[id.getValue()];
            var mate = asset[file.getValue()];
            done(new sass.types.String(util.format('url(%s) -%spx -%spx no-repeat', asset['__url__'], mate.x, mate.y)));
          },
          'sprite-map($glob)': function (glob, done) {
            Glob(glob.getValue(), {}, function (err, result) {
              if (err)
                throw err;
              async.map(result, function (file, callabck) {
                inputFileSystem.readFile(Path.join(context, file), function (err, buf) {
                  callabck(err, [file, buf]);
                });
              }, function (err, files) {
                var id = ++self._id;
                var layer = new Layout('binary-tree');
                var asset = self.assets[id] = {};

                files.map(function (file) {
                  var _image = Images(file[1]);
                  var meta = {
                    img: _image,
                    name: Path.basename(file[0], Path.extname(file[0])),
                    actualWidth: _image.width(),
                    actualHeight: _image.height()
                  };
                  layer.addItem({
                    width: meta.actualWidth + spriteMargin,
                    height: meta.actualHeight + spriteMargin,
                    meta: meta
                  });
                });

                var spriteLayout = layer['export']();
                var spriteFilePng = Images(spriteLayout.width, spriteLayout.height);

                spriteLayout.items.forEach(function (item) {
                  spriteFilePng.draw(item.meta.img, item.x, item.y);
                  item.meta.x = item.x;
                  item.meta.y = item.y;
                  asset[item.meta.name] = item.meta;
                });

                var spriteFile = spriteFilePng.encode("png");
                var spriteHash = loaderUtils.getHashDigest(spriteFile, null, null, 6);
                var publicPath = compilation.mainTemplate.getPublicPath({
                  hash: compilation.hash
                });

                var assetPath = compilation.mainTemplate.applyPluginsWaterfall(
                  'asset-path', spriteUrl.replace('[ext]', 'png'), {
                    hash: spriteHash,
                    chunk: {
                      id: id,
                      name: id + '.sprite',
                      hash: spriteHash,
                      chunkHash: spriteHash,
                      renderedHash: spriteHash
                    }
                  });

                asset['__url__'] = publicPath + assetPath;
                compilation.assets[assetPath] = new RawSource(spriteFile);
                done(new sass.types.String('' + id));
              });
            });
          }
        }
      };
    }
  });
};