const fs = require('fs')
const rm = require('rimraf')
const path = require('path')
const client = require('scp2')

const dest = '/home/gecko/web/htdocs/beta/'
const idrsaPath = require.resolve('../client/id_rsa')

function AutoRsync2Plugin(compiler) {
  const {config, options} = compiler
  this.compiler = compiler
  this.output = options.output
  this.tempWebPath = config.output.path = options.tempWebPath
}

module.exports = AutoRsync2Plugin

AutoRsync2Plugin.prototype.apply = function (wbCompiler) {
  wbCompiler.plugin('after-emit', (compilation, cb) => {
    const callback = () => {
      this.compiler.costTime('UploadToServer');
      cb();
    }
    if (!this.output) {
      compilation.errors.push(`uploading local files to the server: missing output option\n`)
      return callback()
    }
    client.scp(this.tempWebPath, {
      host: '192.168.229.171',
      port: 32200,
      username: 'gzxlzheng',
      privateKey: fs.readFileSync(idrsaPath),
      path: path.join(dest, this.output)
    }, err => {
      if (err) {
        compilation.errors.push(err)
      }
      rm(this.tempWebPath, callback)
    })
  })
}
