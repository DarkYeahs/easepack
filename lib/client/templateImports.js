exports.include = function(content, indent) {
  if (content && content['default'])
    content = content['default'];
  if (typeof content == 'string' && indent) {
    content = content.split(/(\r|\n)+/).join(`${indent}`);
  }
  return content;
}