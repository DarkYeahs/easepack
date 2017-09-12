const HarmonyCompatiblilityDependency = require("webpack/lib/dependencies/HarmonyCompatibilityDependency")

module.exports = DontScrewIe8Plugin

function DontScrewIe8Plugin() {}

DontScrewIe8Plugin.prototype.apply = function (compiler) {
  compiler.plugin('make', (compilation, callback) => {
    compilation.dependencyTemplates.set(HarmonyCompatiblilityDependency, new HarmonyCompatiblilityTemplate())
    callback(null)
  })
}

function HarmonyCompatiblilityTemplate () {}

HarmonyCompatiblilityTemplate.prototype.apply = function (dep, source) {
  const usedExports = dep.originModule.usedExports
  if(usedExports && !Array.isArray(usedExports)) {
    const exportName = dep.originModule.exportsArgument || 'exports'
    const content = `${exportName}["__esModule"] = true;\n\n`
    source.insert(-10, content);
  }
}
