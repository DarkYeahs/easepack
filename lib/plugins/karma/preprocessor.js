const path = require('path')
const async = require('async')
const Middleware = require('webpack-dev-middleware')
const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')

const easepack = require('../../..')
const config = require('../../../bin/easepack-config')

let blocked = []
let isBlocked = false

function Plugin(
  /* config.basePath */basePath,
  /* config.frameworks */frameworks,
  customFileHandlers,
  emitter
) {
  this.files = []
  this.waiting = []
  this.emitter = emitter
  this.basePath = basePath

  config.set({
    useEs2015: true,
    useExtract: false,
    nodeEnv: '"test"',
    output: '/_karma_easepack_/',
    publicPath: '/_karma_easepack_/'
  })

  this.middleware = null
  this.compiler = easepack(config)
  this.compiler.config.output.filename = '[name]'
  this.compiler.config.entry = () => {
    return {}
  }

  customFileHandlers.push({
    urlRegex: /^\/_karma_easepack_\/.*/,
    handler: (req, res) => {
      this.middleware(req, res, () => {
        res.statusCode = 404
        res.end('Not found')
      })
    }
  })

  emitter.on('exit', (done) => {
    this.middleware.close()
    done()
  })
}

Plugin.prototype.getMiddleware = function (callback) {
  if (this.middleware) {
    callback(this.middleware)
  } else {
    this.compiler.run((webpackCompiler) => {
      ['invalid', 'watch-run', 'run'].forEach(name => {
        webpackCompiler.plugin(name, (_, callback) => {
          isBlocked = true
          if (typeof callback === 'function') {
            callback()
          }
        })
      })
      webpackCompiler.plugin('done', stats => {
        const noAssets = stats.toJson().assets.length < 1
        if (!this.waiting || this.waiting.length === 0) {
          this.notifyKarmaAboutChanges();
        }
        if (this.waiting && !noAssets) {
          const waiting = this.waiting
          this.waiting = null
          waiting.forEach(cb => cb())
        }
        isBlocked = false
        blocked.forEach(b => b())
        blocked = []
      })
      webpackCompiler.plugin('make', (compilation, callback) => {
        async.forEach(this.files.slice(), (file, callback) => {
          const dep = new SingleEntryDependency(file)
          const name = path.relative(this.basePath, file).replace(/\\/g, '/')
          compilation.addEntry('', dep, name, () => {
            if (
              dep.module &&
              dep.module.error &&
              dep.module.error.error &&
              dep.module.error.error.code === 'ENOENT'
            ) {
              this.files = this.files.filter(f => file !== f);
              this.middleware.invalidate();
            }
            callback()
          })
        }, callback)
      })
      webpackCompiler.plugin('this-compilation', (compilation, params) => {
        compilation.dependencyFactories.set(SingleEntryDependency, params.normalModuleFactory);
      })
      callback((this.middleware = new Middleware(webpackCompiler, {
        noInfo: true,
        publicPath: '/_karma_easepack_/'
      })))
    }, true)
  }
}

Plugin.prototype.notifyKarmaAboutChanges = function () {
  this.emitter.refreshFiles()
};

Plugin.prototype.addFile = function (entry) {
  if (~this.files.indexOf(entry)) return false
  this.files.push(entry)
  return true
}

Plugin.prototype.readFile = function (file, callback) {
  const doRead = () => {
    try {
      const filePath = `/_karma_easepack_/${file.replace(/\\/g, '/')}`
      const content = this.middleware.fileSystem.readFileSync(filePath)
      callback(null, content)
    } catch (e) {
      if (e.code === 'ENOENT') {
        this.waiting = [process.nextTick.bind(
          process,
          this.readFile.bind(this, file, callback)
        )]
      } else {
        callback(e)
      }
    }
  }
  if (!this.waiting) {
    doRead();
  } else {
    this.waiting.push(process.nextTick.bind(
      process,
      this.readFile.bind(this, file, callback))
    )
  }
}

function createPreprocesor(
  /* config.basePath */basePath,
  easepackPlugin
) {
  return (content, file, done) => {
    easepackPlugin.getMiddleware(middleware => {
      if (easepackPlugin.addFile(file.path)) {
        middleware.invalidate()
      }
      easepackPlugin.readFile(path.relative(basePath, file.path), (err, content) => {
        if (err) throw err
        done(err, content && content.toString());
      })
    })
  }
}

function createEasepackBlocker() {
  return (request, response, next) => {
    if (isBlocked) {
      blocked.push(next)
    } else {
      next()
    }
  }
}

module.exports = {
  easepackPlugin: ['type', Plugin],
  'preprocessor:easepack': ['factory', createPreprocesor],
  'middleware:easepackBlocker': ['factory', createEasepackBlocker]
}
