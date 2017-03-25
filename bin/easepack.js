#!/usr/bin/env node
var easepack = require('..');
var program = require('commander');

process.title = "easepack";

program
  .version(require('../package').version)
  .usage('<command> [options]')
  .command('build', 'build a project')
  .parse(process.argv);