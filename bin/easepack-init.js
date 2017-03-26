var os = require('os');
var Path = require('path');
var program = require('commander');
var exec = require('child_process').exec;
var loaderUtils = require("loader-utils");

var tempDirName = '.easepack-temp';
var tempPath = Path.join(os.tmpdir(), '..', tempDirName);
var repo = 'ssh://git@git-cc.nie.netease.com:32200/frontend/';

program
  .usage('<template-name> [project-name]')
  .option('--offline', 'use cached template')
  .parse(process.argv);

var template = program.args[0];
var repoUrl = repo + template + '.git';
var hash = loaderUtils.getHashDigest(repoUrl, null, null, 6);

