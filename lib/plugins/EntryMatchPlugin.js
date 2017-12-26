const glob = require('glob');
const Path = require('path');
const async = require('async');

const HtmlPlugin = require('./HtmlPlugin');
const FileEmitPlugin = require('./FileEmitPlugin');

const entryNameExpr = /^\.\/|\.\w+$/g;

function EntryMatchPlugin() {}

module.exports = EntryMatchPlugin;
module.exports.entryNameExpr = entryNameExpr;

EntryMatchPlugin.prototype.apply = function (compiler) {
  var config = compiler.config;
  var options = compiler.options;
  if (!options.matches.length) return
  compiler.plugin('configuration', (callback) => {
    async.map(options.matches, (match, callback) => {
      glob(match.pattern, {cwd: compiler.context}, (err, result) => {
        if (err) return callback(err);
        result.forEach(path => {
          if (path === options.config) return;
          var _props = compiler.assets[path] || {};
          compiler.assets[path] = Object.assign(_props, match.props);
        });
        callback();
      });
    }, (err) => {
      if (err) throw err;
      // Object.keys(compiler.assets).forEach(file => {
      //   const ext = Path.extname(file);
      //   const name = file.replace(entryNameExpr, '');
      //   const props = Object.assign(compiler.assets[file], { name });
      //   if (ext === '.js') {
      //     if (compiler.multi.length) {
      //       config.entry[name] = compiler.multi.concat(`./${file}`)
      //     } else {
      //       config.entry[name] = `./${file}`
      //     }
      //   } else if (ext === '.html') {
      //     config.plugins.push(new HtmlPlugin(props, file, compiler));
      //   } else if (props.emit) {
      //     config.plugins.push(new FileEmitPlugin(props, file));
      //   }
      // })
      Object.keys(compiler.assets).forEach(file => {
        var props = compiler.assets[file];
        props.name = file.replace(entryNameExpr, '');
        switch (Path.extname(file)) {
          case '.js':
            if (compiler.multi.length) {
              config.entry[props.name] = compiler.multi.concat(`./${file}`)
            } else {
              config.entry[props.name] = `./${file}`
            }
            break;
          case '.html':
            config.plugins.push(new HtmlPlugin(props, file, compiler));
            break;
          default:
            if (props.emit) {
              config.plugins.push(new FileEmitPlugin(props, file));
            }
        }
      });
      callback();
    });
  });
};
