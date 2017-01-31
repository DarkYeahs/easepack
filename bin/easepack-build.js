var easepack = require('..');
var path = require('path');
var program = require('commander');
var config = require('./easepack-config');

Object.defineProperty(global, 'easepack', {
  enumerable: true,
  writable: false,
  value: easepack
});

program
  .usage('[entry]')
  .option('-c, --config [file]', 'use custom config file')
  .option('-m, --media [media]', 'output directory for bundled files')
  .parse(process.argv);

Object.assign(config, program);

['match', 'media'].map(function (key) {
  easepack[key] = function () {
    return config[key].apply(config, arguments);
  };
});

var configName = program.config || 'ep.config.js';
require(path.join(config.context, configName));

function compilerCallback() {
}

var compiler = easepack(config);

if (program.watch) {
  compiler.watch({}, compilerCallback);
} else {
  compiler.run(compilerCallback);
}