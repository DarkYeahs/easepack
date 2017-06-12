var fs = require('fs');
var Path = require('path');
var program = require('commander');
var exec = require('child_process').exec;
var loaderUtils = require("loader-utils");
var NodeOutputFileSystem = require('webpack/lib/node/NodeOutputFileSystem');

var config = require('./easepack-config');
var ResolveTempDir = require('../lib/plugins/ResolveTempDirPlugin')

var tempPath = ResolveTempDir.tempPath();
var repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/';
var fileSystem = new NodeOutputFileSystem();

program
  .usage('<project-name> [template-name]')
  //.option('--offline', 'use cached template')
  .parse(process.argv);

var template = program.args[1];
var repoUrl = repo + (template || 'ep_dome') + '.git';
var hashUrl = loaderUtils.getHashDigest(repoUrl, null, null, 6);
var templatePath = Path.join(tempPath, 'template' + hashUrl);
var project = Path.join(config.context, program.args[0] || 'ep_dome');

fs.access(templatePath, function (err) {
  var commend = !err ?
    ['git', 'pull', 'origin'] :
    ['git', 'clone', repoUrl, templatePath];
  var options = err
    ? {stdio: 'inherit'}
    : {cwd: templatePath, stdio: 'inherit'};

  exec(commend.join(' '), options, function (err) {
    if (err) throw err;
    copyTo(templatePath, project, function (err) {
      if (err) throw err;
    });
  });
});

function copyTo(from, to, callback) {
  fs.readdir(from, function (err, files) {
    if (err) return callback(err);
    files.forEach(function (file) {
      if (!/^\.git/.test(file)) {
        var fromPath = Path.join(from, file);
        fs.stat(fromPath, function (err, stat) {
          if (err) return callback(err);
          if (stat.isFile()) {
            fileSystem.mkdirp(to, function (err) {
              if (err) callback(err);
              fs.createReadStream(fromPath)
                .pipe(fs.createWriteStream(Path.join(to, file)));
            });
          } else if (stat.isDirectory()) {
            copyTo(fromPath, Path.join(to, file));
          }
        })
      }
    })
  });
}