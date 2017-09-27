const http = require('http')

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

CheckVersionPlugin.prototype.apply = function (compiler) {
  // 给测试用例
  const pkg = arguments[1]
    ? arguments[1] : require('../../package.json')

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
          if (remotePkg.version !== pkg.version) {
            process.stdout.write(alert
              .replace('_c_version_', pkg.version)
              .replace('_version_', remotePkg.version)
            )
          }
          if (remotePkg['version:component'] !== pkg['version:component']) {
            compiler.options.setIfUndefined('upToDate', false)
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
