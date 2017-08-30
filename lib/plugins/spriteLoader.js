const utils = require('loader-utils');
const SpritePlugin = require('./SassOptionsPlugin');

const sprite = new SpritePlugin(null, 0, true);

module.exports = function () {}

module.exports.pitch = function () {
  const str = this.resourceQuery
  const query = utils.parseQuery(str)
  if (query.url) {
    return `module.exports = ${JSON.stringify(query.url)}`
  }
  const req = query.pattern
  const context = query.context
  if (sprite.resolvePatternUrl(req, context, this._compilation, (err, pattern) => {
    if (err) {
      return async(err)
    }
    sprite._genSpriteMapByPattern(pattern, 'left-right', this, (err, id) => {
      var objSprite = Object.assign({}, sprite.assets[id]);
      delete objSprite.__layout__;
      delete objSprite.__from_cache__;
      delete objSprite.__hash_context__;
      async(err, `module.exports=${JSON.stringify(objSprite)}`)
    })
  })) {
    var async = this.async()
  } else {
    this.emitError(`pattern format error: ${req}`)
  }
}
