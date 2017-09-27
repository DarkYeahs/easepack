const HarmonyCompatiblilityDependency = require('webpack/lib/dependencies/HarmonyCompatibilityDependency')

module.exports = DontScrewIe8Plugin

function DontScrewIe8Plugin(compiler) {
  if (compiler.options.useUglifyjs === true) {
    compiler.options.useUglifyjs = {
      output: {screw_ie8: false},
      mangle: {screw_ie8: false},
      compress: {screw_ie8: false, warnings: false}
    }
  }
}

DontScrewIe8Plugin.prototype.apply = function (compiler) {
  compiler.plugin('make', (compilation, callback) => {
    compilation.dependencyTemplates.set(HarmonyCompatiblilityDependency, new HarmonyCompatiblilityTemplate())
    callback()
  })
  // compiler.plugin('compilation', (compilation, params) => {
  //   params.normalModuleFactory.plugin('parser', parser => {
  //     parser.plugin('expression rawScriptExports.default', expr => {})
  //   })
  // })
}

function HarmonyCompatiblilityTemplate () {}

HarmonyCompatiblilityTemplate.prototype.apply = function (dep, source) {
  const usedExports = dep.originModule.usedExports
  if (usedExports && !Array.isArray(usedExports)) {
    const exportName = dep.originModule.exportsArgument || 'exports'
    const content = `${exportName}["__esModule"] = true;\n\n`
    source.insert(-10, content);
  }
}
