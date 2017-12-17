const defaultColors = {
  normal: '',
  bold: "\u001b[1m",
  yellow: "\u001b[1m\u001b[33m",
  red: "\u001b[1m\u001b[31m",
  green: "\u001b[1m\u001b[32m",
  cyan: "\u001b[1m\u001b[36m",
  magenta: "\u001b[1m\u001b[35m"
};

function Stats () {
}

Object.keys(defaultColors).forEach(color => {
  Stats[color] = function (msg) {
    process.stdout.write(`${defaultColors[color]}${msg}\u001b[39m\u001b[22m`)
  }
})

Stats.newline = function () {
  console.log()
}

module.exports = Stats