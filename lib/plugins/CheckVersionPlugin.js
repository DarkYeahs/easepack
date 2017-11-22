const path = require('path')
const http = require('http')
const NodeOutputFileSystem = require('webpack/lib/node/NodeOutputFileSystem')

const fs = new NodeOutputFileSystem()

const options = {
  method: 'GET',
  timeout: 1500,
  hostname: '192.168.229.171',
  path: '/web/activity/easepack_doc/package.json'
}

const alert = `\u001b[1m\u001b[33mA newer version of easepack is available.\u001b[39m\u001b[22m
Latest:   \u001b[1m\u001b[32m_version_\u001b[39m\u001b[22m
Current:  \u001b[1m\u001b[31m_c_version_\u001b[39m\u001b[22m
\n`

function CheckVersionPlugin() {}

module.exports = CheckVersionPlugin;
module.exports.vlt = vlt;

CheckVersionPlugin.prototype.apply = function (compiler) {
  // 给测试用例
  const pkg = arguments[1]
    ? arguments[1] : require('../../package.json')
  const componentJson = path.join(compiler.options.tempPath, 'component.json')

  let cVersion
  try {
    cVersion = require(componentJson)
  } catch (err) {
    cVersion = {version: '0.0.0'}
  }
  compiler.plugin('configuration', callback => {
    const req = http.request(options, res => {
      res.setEncoding('utf8')
      if (res.statusCode === 200) {
        let rawData = ''
        res.on('data', chunk => {
          rawData += chunk
        })
        res.on('end', () => {
          const remotePkg = JSON.parse(rawData)
          if (vlt(pkg.version, remotePkg.version)) {
            process.stdout.write(alert.replace('_c_version_', pkg.version)
              .replace('_version_', remotePkg.version))
          }
          if (remotePkg['version:component'] !== cVersion.version) {
            cVersion.version = remotePkg['version:component']
            // fs.writeFile(componentJson, JSON.stringify(cVersion), 'utf8')
            compiler.options.setIfUndefined('upToDate', false)
            fs.mkdirp(compiler.options.tempPath, err => {
              err || fs.writeFile(componentJson, JSON.stringify(cVersion))
            })
          }
          callback()
        })
      } else {
        callback()
      }
    })
    req.on('error', () => callback())
    req.end()
  })
}

// v1 小于或等于 v2
function vlt (v1, v2) {
  if (!v1 || !v2) {
    return false
  }
  const version1 = v1.split('.')
  const version2 = v2.split('.')
  for (let i = 0; i < version1.length; i++) {
    if (+version1[i] < +version2[i]) {
      return true
    }
  }
  return false
}
