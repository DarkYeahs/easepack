var path = require('path');
var execa = require('execa');
var fs = require('fs');
var images = require('images');

var expect = require('chai').expect;
var rm = require('rimraf').sync;
var exec = require('child_process').execSync;

describe('command:build', function () {
  var cli = path.join(__dirname, '../../bin/easepack-build.js');
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
      execa('node', [cli], {stdio: 'inherit'})
        .then(function (res) {
          result = res;
          files = fs.readdirSync('dist');
          done();
        })
        .catch(done);
    });

    after(teardown);

    it('build with expected files', function (done) {
      expect(files.length).to.equal(10);
      expect(result.code).to.equal(0);
      done();
    })

    it('build with extract css file', function (done) {
      expect(files.filter(function (file) {
        return file.endsWith('.css');
      })).to.deep.equal(['entry.css']);
      done();
    })

    it('build js&css with banner info', (done) => {
      var anchor = JSON.stringify(exec('git config --get user.name').toString().trim()).slice(1, -1);
      var cssContent = fs.readFileSync('dist/entry.css', 'utf8');
      var jsContent = fs.readFileSync('dist/entry.js', 'utf8');
      expect(typeof anchor).to.contain('string');
      expect(cssContent).to.contain('e2e/mock-ep-app');
      expect(jsContent).to.contain('e2e/mock-ep-app');
      expect(cssContent).to.contain(anchor);
      expect(jsContent).to.contain(anchor);
      done();
    });

    it('build css with correct url', (done) => {
      var cssContent = fs.readFileSync('dist/entry.css', 'utf8');
      expect(cssContent).to.contain('background:url(//cc.cdn.com/image.spr.png?a83eaf)');
      expect(cssContent).to.contain('body{display:flex;');
      done();
    });

    it('build js/css with minify files', function (done) {
      var cssContent = fs.readFileSync('dist/entry.css', 'utf8');
      var jsContent = fs.readFileSync('dist/entry.js', 'utf8');
      expect(cssContent.split('\n').length).to.equal(2);
      expect(jsContent.split('\n').length).to.equal(2);
      done();
    })

    it('build index.html with correct url', function (done) {
      var content = fs.readFileSync('dist/index.html', 'utf8');
      expect(typeof content).to.equal('string');
      expect(content).to.contain('<img src="//cc.cdn.com/image1.png">');
      expect(content).to.contain('<!-- <script src="entry.js"></script> -->');
      expect(content).to.contain('href="//cc.cdn.com/entry.css" rel="stylesheet">\r\n</head>');
      expect(content).to.contain('<!--[if IE 7]><script src="//cc.cdn.com/entry.js"');
      expect(content).to.contain('</div>\r\n<script src="//cc.cdn.com/entry.js">');
      expect(content).to.contain('<script src="entry_not_exist.js">');
      done();
    });

    it('build list.html with correct url', function (done) {
      var content = fs.readFileSync('dist/list.html', 'utf8');
      expect(typeof content).to.equal('string');
      expect(content).to.contain('<meta charset="utf-8">\r\n</head>');
      expect(content).to.contain('{% block css %}\r\n  <link href="//cc.cdn.com/entry.css"');
      done();
    });

    it('build with sprite correct sprite minify', function (done) {
      var spriteFile = files.filter(file => (file.endsWith('image.spr.png')))[0];
      var pngFile = files.filter(file => (file.endsWith('image1.png')))[0];
      expect(typeof spriteFile).to.equal('string');
      expect(typeof pngFile).to.equal('string');
      var spriteContent = fs.readFileSync(path.join('dist', spriteFile));
      var pngImage = images(spriteContent);
      expect(spriteContent.length < 3620).to.equal(true);
      expect(pngImage.height()).to.equal(44);
      expect(pngImage.width()).to.equal(78);
      done();
    });

    it('build with left-right sprite corrected', function (done) {
      var spriteFile = files.filter(file => (file.endsWith('leftright.spr.png')))[0];
      expect(typeof spriteFile).to.equal('string');
      var spriteContent = fs.readFileSync(path.join('dist', spriteFile));
      var pngImage = images(spriteContent);
      expect(pngImage.height()).to.equal(129);
      expect(pngImage.width()).to.equal(816);
      done();
    });

    it('build with images using base64', function (done) {
      var file = files.filter(file => (file.endsWith('.css')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('data:image/jpeg;base64');
      expect(content).to.contain('data:image/png;base64');
      expect(content).to.not.contain('base64/inline.png');
      expect(typeof file).to.equal('string');
      done();
    });

    it('build with image/sprite using url', function (done) {
      var file = files.filter(file => (file.endsWith('.css')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('gt15kb.str.png?ea33fc');
      expect(content).to.contain('image.spr.png?a83eaf');
      done();
    });

    it('build with entry using es2015', function (done) {
      var file = files.filter(file => (file.endsWith('.js')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain(', and output "+');
      expect(content).not.to.contain('let ');
      done();
    });

    it('build with inline file', function (done) {
      var file = files.filter(file => (file.endsWith('.js')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('{"name": "easepack"}');
      done();
    });

    it('build with random file url', function (done) {
      var file = files.filter(file => (file.endsWith('.js')))[0];
      var fileSac = files.filter(file => (file.endsWith('.sac')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(fileSac).to.equal('fileUrl89f15e.sac');
      expect(content).to.contain('fileUrl89f15e.sac');
      done();
    });

  });

  describe('build with media', function () {
    var result, files;

    before(function (done) {
      setup();
      execa('node', [cli, '-m', 'm1'], {stdio: 'inherit'})
        .then(function (res) {
          result = res;
          files = fs.readdirSync('dist');
          done();
        })
        .catch(done);
    });

    after(teardown);

    it('build with expected files', function (done) {
      expect(files.length).to.equal(13);
      expect(result.code).to.equal(0);
      done();
    })

    it('build with source map', function (done) {
      var mapFiles = files.filter(file => (file.endsWith('.map')));
      expect(mapFiles.length).to.equal(2);
      done();
    })

    it('build with customing a banner', function (done) {
      var file = files.filter(file => (file.endsWith('.js')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('/*! custom a banner */');
      done();
    })

    it('build with autoprefixer', function (done) {
      var file = files.filter(file => (file.endsWith('.css')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('display:-webkit-box;display:-webkit-flex;');
      expect(content).to.contain('-webkit-transition:all 1s ease;transition:all 1s ease');
      done();
    })

    it('build with emit files', function (done) {
      var file = files.filter(file => (file.endsWith('.md')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('# guide file');
      expect(file).to.equal('guide.23556b.md');
      done();
    });

    it('build correct width components', function (done) {
      var file = files.filter(file => (file.endsWith('.css')))[0];
      var components = files.filter(file => (file.endsWith('_c_')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('_c_/vuxDivider@1/divider.ea33fc.png');
      expect(typeof components).to.equal('string');
      done();
    })
  });

});