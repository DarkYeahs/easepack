var path = require('path');
var execa = require('execa');
var fs = require('fs');

var expect = require('chai').expect;
var rm = require('rimraf').sync;
var exec = require('child_process').execSync;

describe('command:init', () => {
  var cli = path.join(__dirname, '../../bin/easepack-init.js');
  var originalCwd = process.cwd();

  function setup() {
    process.chdir(path.join(__dirname))
  }

  function teardown(done) {
    rm('init-dome');
    process.chdir(originalCwd)
    done()
  }

  describe('init dome', () => {
    var result, files;

    before(done => {
      setup();
      execa('node', [cli, 'init-dome'], {stdio: 'inherit'})
        .then(function (res) {
          result = res;
          files = fs.readdirSync('init-dome');
          done();
        })
        .catch(done);
    });

    after(teardown);

    it('init with expected files', done => {
      expect(files.length).to.equal(6);
      expect(result.code).to.equal(0);
      done();
    })
  });
});