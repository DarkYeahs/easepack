const fs = require('fs');
const Path = require('path');
const async = require('async');
var exec = require('child_process').exec;

const version = require('../../package.json').version[0]
const sprite = require.resolve('../client/placehold.sprite');
const ResolveTempDirPlugin = require('./ResolveTempDirPlugin');

const aliasExpr = /^((?!\.|test|doc|package)[\w-]+)(?:@(\d))?(?:\.\w+)?$/
const repo = ResolveTempDirPlugin.REPO_URL;

function ResolveAliasPlugin() {}

module.exports = ResolveAliasPlugin;

ResolveAliasPlugin.prototype.apply = function (compiler) {
  const config = compiler.config
  const options = compiler.options
  // const context = compiler.context
  config.resolve.alias.sprite = sprite

  const readDirAlias = dir => {
    return cb => {
      if (!dir) {
        return cb()
      }
      fs.readdir(dir, (err, files) => {
        if (err) {
          compiler.emitError(`resolve alias ${err}\n`)
          return cb()
        }
        files.forEach(file => {
          const args = aliasExpr.exec(file)
          if (args && (!args[2] || args[2] === version)) {
            config.resolve.alias[args[1]] = Path.join(dir, file)
          }
        })
        cb()
      })
    }
  }

  const updateRepository = callback => {
    const cwd = options.tempComponents
    const cb = err => {
      if (err) {
        compiler.emitError(err)
      }
      callback()
    }
    if (!fs.existsSync(cwd)) {
      exec(`git clone ${repo} ${cwd}`, {stdio: 'inherit'}, cb)
      return
    }
    if (!options.upToDate) {
      exec(`git pull origin`, {cwd, stdio: 'inherit'}, cb)
      return
    }
    cb()
  }

  compiler.plugin('configuration', callback => {
    async.waterfall([
      updateRepository,
      readDirAlias(options.tempComponents),
      readDirAlias(options.privateRepo),
      callback => {
        // handle alias
        Object.keys(options.alias).forEach(key => {
          if (config.resolve.alias[key]) {
            compiler.emitError(`duplicate alias key: ${key}\n`)
          } else {
            let val = options.alias[key]
            if (!Path.isAbsolute(val)) {
              val = Path.resolve(compiler.context, val)
            }
            config.resolve.alias[key] = val
          }
        })
        callback()
      }
    ], callback)
  })
}
