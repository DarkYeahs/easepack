var os = require('os');
var fs = require('fs');
var Path = require('path');
var program = require('commander');
var exec = require('child_process').exec;
var loaderUtils = require("loader-utils");
var NodeOutputFileSystem = require('webpack/lib/node/NodeOutputFileSystem')

var config = require('./easepack-config');

var tempDirName = '.easepack-temp';
var tempPath = Path.join(os.tmpdir(), '..', tempDirName);
var repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/';
var fileSystem = new NodeOutputFileSystem();

program
  .usage('<project-name> [template-name]')
  .option('--offline', 'use cached template')
  .parse(process.argv);

var template = program.args[1];
var repoUrl = repo + (template || 'ep_dome') + '.git';
var project = Path.join(config.context, program.args[0]);
var hashUrl = loaderUtils.getHashDigest(repoUrl, null, null, 6);
var templatePath = Path.join(tempPath, 'template', hashUrl);

fs.access(templatePath, function (err) {
  var commend = !err ?
    ['git', 'pull', 'origin'] :
    ['git', 'clone', repoUrl, templatePath];
  var options = {cwd: templatePath, stdio: 'inherit'};

  exec(commend.join(' '), options, function (err) {
    if (err) throw err;
    copyTo(templatePath, project, function () {

    });
  });
});

function copyTo(from, to, callback) {
  fs.readdir(from, function (err, files) {
    if (err) return callback(err);
    files.forEach(function (err, file) {

    })
  });
}

function writeOut(err) {
}