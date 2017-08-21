const loaderUtils = require('loader-utils');
const SpritePlugin = require('./SassOptionsPlugin');

const sprite = new SpritePlugin(null, 0, true);

module.exports = function () {}

module.exports.pitch = function () {
  const query = loaderUtils.parseQuery(this.resourceQuery);
  if (query.url) {
    return `module.exports = ${JSON.stringify(query.url)}`
  }
  const async = this.async()
  const pattern = query.pattern
  const compilation = this._compilation
  sprite._genSpriteMapByPattern(pattern, 'left-right', compilation, (err, id) => {
    var objSprite = Object.assign({}, sprite.assets[id]);
    delete objSprite.__layout__;
    delete objSprite.__from_cache__;
    delete objSprite.__hash_context__;
    async(err, `module.exports = ${JSON.stringify(objSprite)}`);
  })
}
