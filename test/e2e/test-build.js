var path = require('path');
var execa = require('execa');
var fs = require('fs');
var images = require('images');
var getStream = require('get-stream');
var { tempPath } = require('../../lib/plugins/ResolveTempDirPlugin')

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
      rm(tempPath());
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
      expect(files.length).to.equal(13);
      expect(result.code).to.equal(0);
      done();
    })

    it('build with extract css file', function (done) {
      expect(files.filter(function (file) {
        return file.endsWith('.css');
      })).to.deep.equal(['entry.css', 'entry2.css']);
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
      expect(cssContent).to.contain('background:url(//cc.cdn.com/image.spr.png?');
      expect(cssContent).to.contain('body{display:flex;');
      done();
    });

    it('build js/css with minify files', function (done) {
      var cssContent = fs.readFileSync('dist/entry.css', 'utf8');
      var jsContent = fs.readFileSync('dist/entry.js', 'utf8');
      expect(cssContent.split('\n').length).to.equal(2);
      expect(jsContent.split('\n').length).to.equal(2);

      // 判断是否去掉重复的内容
      var count = 0, expr = /\.duplicate\{/g;
      while (expr.exec(cssContent)) count++;
      expect(count).to.equal(1);

      done();
    })

    it('build index.html with correct url', function (done) {
      var content = fs.readFileSync('dist/index.html', 'utf8');
      expect(typeof content).to.equal('string');
      expect(content.split('\n').length).to.equal(29);
      expect(content.indexOf('<!DOCTYPE html>')).to.equal(0);
      expect(content).to.contain('<img src="//cc.cdn.com/image1.png">');
      expect(content).to.contain('<img src="data:image/png;base64,iVBOR');
      expect(content).to.contain('<!-- <script src="entry.js"></script> -->');
      expect(content).to.contain('<!--[if IE 7]><script src="//cc.cdn.com/entry.js"');
      expect(content).to.contain('</div>\r\n<script src="//cc.cdn.com/entry.js">');
      expect(content).to.contain('<script src="entry_not_exist.js" crossorigin="anonymous">');
      expect(content).to.contain('/__easepack_dev_server__/livereload.js?snipver=1"');
      expect(content).to.contain('href="//cc.cdn.com/entry.css" rel="stylesheet">\r\n</head>');
      done();
    });

    it('build list.html with correct url', function (done) {
      var content = fs.readFileSync('dist/list.html', 'utf8');
      expect(typeof content).to.equal('string');
      expect(content).to.contain('<meta charset="utf-8">\r\n</head>');
      expect(content).to.contain('<script src="http://cc.cottage.netease.co');
      expect(content).to.contain('{% block css %}\r\n  <link href="//cc.cdn.com/entry.css"');
      expect(content).to.contain('//cc.cdn.com/entry2.css" rel="stylesheet">\r\n{% endblock %}');
      done();
    });

    it('build with sprite correct sprite minify', function (done) {
      var spriteFile = files.filter(file => (file.endsWith('image.spr.png')))[0];
      var pngFile = files.filter(file => (file.endsWith('image1.png')))[0];
      expect(typeof spriteFile).to.equal('string');
      expect(typeof pngFile).to.equal('string');
      var spriteContent = fs.readFileSync(path.join('dist', spriteFile));
      var pngImage = images(spriteContent);
      expect(spriteContent.length < 4000).to.equal(true);
      expect(pngImage.height()).to.equal(46);
      expect(pngImage.width()).to.equal(82);
      done();
    });

    it('build with left-right sprite corrected', function (done) {
      var spriteFile = files.filter(file => (file.endsWith('leftright.spr.png')))[0];
      expect(typeof spriteFile).to.equal('string');
      var spriteContent = fs.readFileSync(path.join('dist', spriteFile));
      var pngImage = images(spriteContent);
      expect(pngImage.height()).to.equal(131);
      expect(pngImage.width()).to.equal(824);
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
      expect(content).to.contain('gt15kb.str.png?');
      expect(content).to.contain('image.spr.png?');
      done();
    });

    it('build with entry using es2015', function (done) {
      var file = files.filter(file => (file.endsWith('.js')))[0];
      var content = fs.readFileSync(path.join('dist', file), 'utf8');
      expect(content).to.contain('nums.forEach(function(');
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

    it('build with correct node_env', function (done) {
      var content = fs.readFileSync('dist/entry.js', 'utf8');
      var htmlContent = fs.readFileSync('dist/index.html', 'utf8');
      var components = files.filter(file => (file.endsWith('_c_')))[0];
      expect(htmlContent).to.not.contain('<div>NODE_ENV为m1</div>');
      expect(content).to.not.contain('vuxDivider@1');
      expect(components).to.equal(undefined);
      done();
    });

    it('build with correct file-path', function (done) {
      var content = fs.readFileSync('dist/entry.css', 'utf8');
      expect(content).to.contain('//cc.cdn.com/filepath/images.spr.png?');
      expect(fs.existsSync('dist/filepath/filePath.sac')).to.equal(true);
      expect(fs.existsSync('dist/filepath/images.spr.png')).to.equal(true);
      done();
    });

  });

  describe('build with media', function () {
    var result, files, stdout;

    before(function (done) {
      setup();
      const ex = execa('node', [cli, '-m', 'm1'])
      const stream = ex.stdout

      getStream(stream).then(value => {
        stdout = value
      });

      ex.then(function (res) {
          result = res;
          files = fs.readdirSync('dist');
          done();
        })
        .catch(done);
    });

    after(teardown);

    it('build with expected files', function (done) {
      expect(files.length).to.equal(19);
      expect(result.code).to.equal(0);
      done();
    })

    it('build with expected warned', function (done) {
      expect(stdout).to.contain(`Can't use [hash] as name in development (use ?[hash] instead)`);
      done();
    })

    it('build with source map', function (done) {
      var mapFiles = files.filter(file => (file.endsWith('.map')));
      expect(mapFiles.length).to.equal(3);
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
      expect(fs.existsSync('dist/_c_/vuxDivider@1/divider.png')).to.equal(true);
      expect(content).to.contain('_c_/vuxDivider@1/divider.png?ea33fc');
      expect(typeof components).to.equal('string');
      done();
    })

    it('build with node_env', function (done) {
      var content = fs.readFileSync('dist/entry.js', 'utf8');
      expect(content).to.contain('vuxDivider@1');
      done();
    });

    it('build html with ejs', function (done) {
      var htmlContent = fs.readFileSync('dist/index.html', 'utf8');
      expect(htmlContent).to.contain('<div>NODE_ENV为\'m1\'</div>');
      done();
    });

    it('build with correct file-path', function (done) {
      var content = fs.readFileSync('dist/list.html', 'utf8');
      var fileContent = fs.readFileSync('dist/file.html', 'utf8');
      expect(fs.existsSync('dist/filepath/file.js')).to.equal(true);
      expect(fs.existsSync('dist/filePath89f15e.sac')).to.equal(true);
      expect(fileContent).to.contain('//cc.cdn.com/filepath/file.js?');
      expect(fileContent).to.contain('src="//cc.cdn.com/filepath/image1.png"');
      expect(content).to.contain('//cc.cdn.com/filePath89f15e.sac');
      expect(typeof fileContent).to.equal('string');
      done();
    });

    it('build width include template', (done) => {
      var content = fs.readFileSync('dist/file.html', 'utf8');
      expect(fs.existsSync('dist/filepath/meta.html')).to.equal(false);
      expect(content).to.contain('              var clientWidth = do');
      expect(content).to.contain('<meta content="object');
      expect(content).to.not.contain('[object Object]');
      done()
    })

    it('build with within-method', (done) => {
      var content = fs.readFileSync('dist/list.html', 'utf8');
      expect(fs.existsSync('dist/css/entry22fa87c.css')).to.equal(true);
      expect(fs.existsSync('dist/css/entry22fa87c.css.map')).to.equal(true);
      expect(content).to.contain('//cc.cdn.com/css/entry22fa87c.css');
      done();
    })
  });

});


describe('command:build babelrc', function () {
  var cli = path.join(__dirname, '../../bin/easepack-build.js');
  var originalCwd = process.cwd();

  function setup() {
    process.chdir(path.join(__dirname, 'mock-ep-app-rc'))
  }

  function teardown(done) {
    rm('dist');
    process.chdir(originalCwd)
    done()
  }

  describe('build an app', function () {
    var result, files, stdout;

    before(function (done) {
      setup();

      const ex = execa('node', [cli])
      const stream = ex.stdout

      getStream(stream).then(value => {
        stdout = value
      });

      ex.then(function (res) {
          result = res;
          files = fs.readdirSync('dist');
          done();
        })
        .catch(done);
    });

    after(teardown);

    it('build with expected files', function () {
      expect(files.length).to.equal(17);
      expect(result.code).to.equal(0);
    })

    it('build with expected warned', function () {
      expect(stdout).to.contain(`ERROR in duplicate alias key: vuxDivider`)
      expect(stdout).to.contain(`can't evaluate empty html file: empty.html`)
    })

    it('build with es2015 in both js&vue', function () {
      var content = fs.readFileSync('dist/entry.js', 'utf8');
      expect(content).to.contain('nums.forEach(function(');
      expect(content).not.to.contain('let ');
    });

    it('build sprite correct publicpath and position', () => {
      let css = ''
      const regexp = /\.bs\.loading\d\{(.*?)\}/g
      const content = fs.readFileSync('dist/entry.css', 'utf8')
      expect(content).to.contain(';width:412px;height:131px}')
      expect(content).to.contain(';background-position:-2px -2px}')
      expect(content).to.contain(';background-position:-208px -2px}')
      while ((css = regexp.exec(content))) {
        expect(css[1]).to.contain('width:202px;height:127px;background:url(matchspritename.png?')
      }
    });

    it('build sprite image matching url prop', () => {
      expect(fs.existsSync('dist/matchspritename.png')).to.equal(true)
    });

    it('build sprite with @import url', function () {
      var content = fs.readFileSync('dist/entry.css', 'utf8')
      expect(fs.existsSync('dist/utilities/aliassprite.png')).to.equal(true)
      expect(fs.existsSync('dist/utilities/relativesprite.png')).to.equal(true)
      expect(content).to.contain('.aliassprite.loading1,.aliassprite.loading3')
      expect(content).to.contain('.relativesprite.loading1,.relativesprite.loading3')
    })

    it('build sprite width __sprite_map__', function (done) {
      var content = fs.readFileSync('dist/entry.js', 'utf8');
      var leftright = images(fs.readFileSync('dist/leftright.png'));
      expect(content).to.contain('{url:"./leftright.png",width:808,height:127}');
      expect(leftright.height()).to.equal(127);
      expect(leftright.width()).to.equal(808);
      done();
    });

    it('build app width commons chunk plugin', function (done) {
      var content = fs.readFileSync('dist/index.html', 'utf8');
      expect(fs.existsSync('dist/vendor.js')).to.equal(true);
      expect(fs.existsSync('dist/manifest.js')).to.equal(true);
      expect(/<script src="\.\/vendor\.js\?\w{6}"? crossorigin="anonymous"/.test(content)).to.equal(true);
      expect(/<script src="\.\/manifest\.js\?\w{6}"? crossorigin="anonymous"/.test(content)).to.equal(true);
      expect(content).to.contain('<script src="./entry.js" crossorigin="anonymous" async></script>');
      done();
    });

    it('build app width split code', function (done) {
      var content = fs.readFileSync('dist/index.html', 'utf8');
      expect(fs.existsSync('dist/_c_/gotaname.chunk.js')).to.equal(true);
      expect(content).to.not.contain('1.chunk.js?7f5f84');
      expect(content).to.not.contain('0.chunk.js?7f5f84');
      expect(content).to.not.contain('gotaname.chunk.js');
      done();
    });

    it('build app with custom prefixer', function (done) {
      var content = fs.readFileSync('dist/entry.css', 'utf8');
      expect(content).to.contain('display:-ms-flexbox;display:flex');
      done();
    });

    it('build and output app without livereload', function (done) {
      var content = fs.readFileSync('dist/index.html', 'utf8');
      expect(content).to.not.contain('__easepack_dev_server__/livereload.js');
      done();
    });

    it('build app that supports ie8', () => {
      var content = fs.readFileSync('dist/entry.js', 'utf8')
      expect(content).to.not.contain('testDefault.default')
      expect(content).to.contain('testDefault["default"]')
      expect(content).to.contain('testDefault={"class":"TEST"}')
      // n.__esModule=!0 webpack 原本会用 Object.defineProperty 方法
      expect(content).to.match(/\w\.__esModule=!0/g)
    })

    it('build correct with setting alias', () => {
      var content = fs.readFileSync('dist/vendor.js', 'utf8') 
        + fs.readFileSync('dist/entry.js', 'utf8')
      expect(content).to.contain('this is alias file')
      expect(content).to.not.contain('this is vux divider file')
    })

    it('build correct css files with cssVueLoader', () => {
      const js = fs.readFileSync('dist/cssLoader.js', 'utf8')
      const css = fs.readFileSync('dist/cssLoader.css', 'utf8')
      // 不要将 vue-loader 的 component-normalizer 也打包进来了
      expect(css).to.not.contain('.staticRenderFns')
      expect(css).to.contain('-webkit-linear-gradient(left,#0a1176,#281059)')
    })

    it('build html require a url js file', () => {
      expect(fs.existsSync('dist/extlibs/libs.js')).to.equal(true);
      expect(fs.existsSync('dist/extlibs/libs2.js')).to.equal(true);
    })

    it('build html/js same name url matched', () => {
      expect(fs.existsSync('dist/htmlurl/same.html')).to.equal(true);
      expect(fs.existsSync('dist/same.html')).to.equal(true);
      expect(fs.existsSync('dist/same.js')).to.equal(true);
    })
  });
});