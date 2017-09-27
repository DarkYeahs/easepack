const path = require('path')
const utils = require('loader-utils')

const styleRewriter = require.resolve('vue-loader/lib/style-rewriter')
const rewriterExpr = /\b(css(?:-loader)?(?:\?[^!]+)?)(?:!|$)/

// stringify an Array of loader objects
function stringifyLoaders (loaders) {
  return loaders.map(obj => {
    return typeof obj === 'object'
      ? `${obj.loader}?${obj.options
        ? JSON.stringify(obj.options) : ''}` : `${obj}`
  }).join('!')
}

// 使用 vue scss loader
module.exports = function (content) {
  if (this.cacheable) {
    this.cacheable()
  }
  const rawRequest = utils.getRemainingRequest(this)
  const type = path.extname(rawRequest).slice(1)

  const loader = this.query.loaders[type]
  if (loader === undefined) {
    throw new Error(`Unsupported style type: *.${type}`)
  }

  const getRawLoaderString = (loader) => {
    loader = stringifyLoaders(loader)
    if (rewriterExpr.test(loader)) {
      loader = loader.replace(rewriterExpr, (m, $1) => {
        return `${$1}!${styleRewriter}!`
      })
    }
    return loader
  }

  if (!this.options.__vueOptions__) {
    this.options.__vueOptions__ = Object.assign({}, this.vue, this.query)
  }

  return `require(${
    utils.stringifyRequest(this,
      // disable all configuration loaders
      `!!${getRawLoaderString(loader)}!${rawRequest}`)
  })`
}
