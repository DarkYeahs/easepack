var Path = require('path');
var exec = require('child_process').exec;

function AutoRsyncPlugin(compiler) {
  this.compiler = compiler;
  this.options = compiler.options;

  compiler.options.output = this.options.autoRsync;
  compiler.config.output.path = this.options.autoRsync;
}

module.exports = AutoRsyncPlugin;

AutoRsyncPlugin.prototype.apply = function (compiler) {
  var options = this.options;
  var webpackOptions = compiler.options;

  var outputPath = Path.join(options.context, options.output, '..');

  console.log(outputPath)

  compiler.plugin('after-emit', function (compilation, callback) {
    exec('svn add release --force', {cwd: outputPath}, function (error) {
      console.log(arguments)
      //console.log(error.code)
    });
    callback();
  });
};