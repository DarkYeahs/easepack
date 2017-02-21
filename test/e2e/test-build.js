var path = require('path');
var execa = require('execa');
var fs = require('fs');

var expect = require('chai').expect;
var rm = require('rimraf').sync;
var exec = require('child_process').execSync;

describe('command:build', function () {
  var cli = path.join(__dirname, '../../bin/easepack-build');
  var originalCwd = process.cwd();

  function setup() {
    process.chdir(path.join(__dirname, 'mock-ep-app'))
  }

  function teardown(done) {
    rm('dist');
    process.chdir(originalCwd)
    done()
  }

  describe('build an app', function () {
    var result, files;

    before(function (done) {
      setup();
      execa('node', [cli, '-o', 'dist'])
        .then(function (res) {
          result = res;
          files = fs.readdirSync('dist');
          done();
        })
        .catch(done);
    });

    after(teardown);

    it('build with expected files', function (done) {
      expect(files.length).to.equal(3);
      expect(result.code).to.equal(0);
      done();
    })

    it('build with extract css file', function (done) {
      expect(files.filter(function (file) {
        return file.endsWith('.css');
      })).to.deep.equal(['entry.css']);
      done();
    })

    it('build with minify js/css, contain git username', function (done) {
      var anchor = JSON.stringify(
        exec('git config --get user.name').toString().trim()).slice(1, -1);
      expect(typeof anchor).to.contain('string');
      files
        .filter(file => (file.endsWith('.js') || file.endsWith('.css')))
        .forEach(file => {
          expect(typeof file).to.equal('string');
          var content = fs.readFileSync(path.join('dist', file), 'utf8');
          expect(content.split('\n').length).to.equal(2);
          expect(content).to.contain(anchor);
        });
      done();
    })

    it('build with html contain correct css/js url', function (done) {
      var htmlFile = files.filter(file => (file.endsWith('.html')))[0];
      expect(typeof htmlFile).to.equal('string');
      var htmlContent = fs.readFileSync(path.join('dist', htmlFile), 'utf8');
      expect(htmlContent).to.contain('//cc.cdn.com/entry.js');
      expect(htmlContent).to.contain('//cc.cdn.com/entry.css');
      expect(htmlContent).to.not.contain('<!-- inject_css -->');
      done();
    })

  });
});