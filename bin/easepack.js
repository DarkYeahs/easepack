#!/usr/bin/env node
var program = require('commander');

process.title = "easepack";

program
  .version(require('../package').version)
  .usage('<command> [options]')
  .command('init', 'generate a new project from a template')
  .command('build', 'prototype a new project')
  .parse(process.argv);