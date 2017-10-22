const fs = require("fs")
const path = require('path')
const Client = require('scp2').Client
const MemoryFileSystem = require("memory-fs")

const id_rsa = require.resolve('../client/id_rsa')
const destination = '/home/gecko/web/htdocs/beta/'

function AutoRsync2Plugin(complier) {
  this.client = new Client({
    host: '192.168.229.171',
    port: 32200,
    username: 'gzxlzheng',
    privateKey: fs.readFileSync(id_rsa)
  })
}

module.exports = AutoRsync2Plugin

AutoRsync2Plugin.prototype.apply = function (compiler) {
  if (!(compiler.outputFileSystem instanceof MemoryFileSystem)) {
    compiler.outputFileSystem = new MemoryFileSystem()
  }
  compiler.plugin('after-emit', (compilation, cb) => {
    // const assets = stats.compilation.assets
    this.client.write({
      destination: path.join(destination, 'icons.png'),
      content: new Buffer('hello world\n')
    }, cb)
  })
}