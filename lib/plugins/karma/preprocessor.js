const path = require('path')
const easepack = require('../../..')
const karmaWebpack = require('karma-webpack')
const config = require('../../../bin/easepack-config')

const WebpackPlugin = karmaWebpack.webpackPlugin[1]
const createEasepackBlocker = karmaWebpack['middleware:webpackBlocker'][1]

function Plugin(
  /* config.easepack */ easepackOptions
) {
  config.set(Object.assign({
    useEs2015: true,
    useExtract: false,
    nodeEnv: '"test"',
    output: '/_karma_easepack_/'
  }, easepackOptions))
  this.compiler = easepack(config)
  this.compiler.config.output.filename = '[name]'
  this.compiler.config.entry = () => {
    return {}
  }
}

Plugin.prototype = Object.create(WebpackPlugin.prototype)
Plugin.prototype.constructor = Plugin

function createPreprocesor(
  /* config.basePath */basePath,
  /* config.files */ files,
  /* config.frameworks */frameworks,
  customFileHandlers,
  emitter,
  easepackPlugin
) {
  return (content, file, done) => {
    if (easepackPlugin.middleware) {
      _createPreprocesor(
        easepackPlugin,
        basePath,
        content,
        file,
        done
      )
    } else {
      easepackPlugin.compiler.run(webpackOptions => {
        WebpackPlugin.call(
          easepackPlugin,
          webpackOptions, {},
          {noInfo: true},
          basePath,
          files,
          frameworks,
          customFileHandlers,
          emitter
        )
        _createPreprocesor(
          easepackPlugin,
          basePath,
          content,
          file,
          done
        )
      }, 'config')
    }
  }
}

function _createPreprocesor(easepackPlugin, basePath, content, file, done) {
  if (easepackPlugin.addFile(file.path)) {
    easepackPlugin.middleware.invalidate()
  }
  easepackPlugin.readFile(path.relative(basePath, file.path), (err, content) => {
    if (err) throw err
    done(err, content && content.toString())
  })
}

module.exports = {
  easepackPlugin: ['type', Plugin],
  'preprocessor:easepack': ['factory', createPreprocesor],
  'middleware:easepackBlocker': ['factory', createEasepackBlocker]
}
