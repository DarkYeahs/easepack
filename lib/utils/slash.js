// Unix    => foo/bar
// Windows => foo/bar
module.exports = function (input) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(input)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(input)
  if (isExtendedLengthPath || hasNonAscii) {
    return input
  }
  return input.replace(/\\/g, '/')
}
