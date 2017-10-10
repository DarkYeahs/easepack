import fs from 'fs'
import os from 'os'
import path from 'path'
import { expect } from 'chai'

import hl from '../../lib/plugins/htmlLoader'
import ul from '../../lib/plugins/urlLoader'
import sap from '../../lib/plugins/SassOptionsPlugin'
import Rtdp from '../../lib/plugins/ResolveTempDirPlugin'
import Rap from '../../lib/plugins/ResolveAliasPlugin'
import Rip from '../../lib/plugins/NetworkInfoPlugin'
import CheckVersion from '../../lib/plugins/CheckVersionPlugin'


import easepack from '../..'
import webpack from 'webpack'

describe('test export plugins', () => {
  it('should export webpack object', () => {
    expect(easepack.webpack).to.equal(webpack)
  })
})

describe('test configuration plugins', () => {
  let context = path.join(__dirname, 'mock-ep-app');
  let compiler = {
    assets: {},
    config: {
      entry: {},
      output: {
        path: './dist'
      },
      resolve: {
        alias: {}
      },
    },
    options: {
      upToDate: true,
      config: 'easepack.config.js',
      privateRepo: '../mock-components',
      matches: [
        {pattern: '*.js'}
      ],
      alias: {
        root: './',
        abs: '/foo/bar'
      },
      setIfUndefined (key, value) {
        this[key] = value
      }
    },
    context: context
  };

  it('correct resolve tempDir', (done) => {
    compiler.plugin = (name, callback) => {
      callback(() => {
        let config = compiler.config;
        let options = compiler.options;
        expect(config.output.path).to.equal(path.join(context, 'dist'));
        expect(options.tempPath).to.equal(path.join(os.tmpdir(), '../.easepack-temp'));
        expect(options.tempWebPath).to.contain(path.join(options.tempPath, 'web'));
        expect(options.tempComponents).to.contain(path.join(options.tempPath, 'components'));
        expect(options.privateRepo).to.contain(path.join(compiler.context, '../mock-components'));
        done();
      });
    }
    new Rtdp().apply(compiler);
  })

  it('correct resolve alias', (done) => {
    compiler.plugin = (name, callback) => {
      callback(() => {
        let config = compiler.config;
        let options = compiler.options;
        let alias = config.resolve.alias;
        console.log(process.env.npm_package_version)
        //make sure read files repo dir 
        expect(Object.keys(alias).length > 10).to.equal(true);
        expect(alias.root).to.equal(context)
        expect(alias.abs).to.equal(options.alias.abs)
        expect(alias.mixin).to.equal(path.join(options.privateRepo, 'mixin.scss'));
        expect(alias.vuxDivider).to.equal(path.join(options.privateRepo, 'vuxDivider@1'));
        expect(alias.sprite).to.equal(require.resolve('../../lib/client/placehold.sprite'));
        // ignore files 
        expect(alias.package).to.equal(undefined)
        expect(alias.version2).to.equal(undefined)
        expect(alias['.namestartwithdot']).to.equal(undefined)
        done()
      });
    }
    new Rap().apply(compiler);
  })

  it('correct network info', (done) => {
    compiler.plugin = (name, callback) => {
      callback(() => {
        expect(typeof compiler.options.ipv4).to.equal('string');
        done();
      });
    }
    new Rip().apply(compiler);
  })

  describe('correct check version', () => {
    let componentJson

    before(done => {
      componentJson = path.join(compiler.options.tempPath, 'component.json')
      fs.writeFile(componentJson, '{"version":"0.0.0"}', done)
    })

    it('lastest version', (done) => {
      compiler.options.upToDate = true
      compiler.plugin = (name, callback) => {
        callback(() => {
          expect(compiler.options.upToDate).to.equal(false)
          done()
        })
      }
      new CheckVersion().apply(compiler)
    })

    it('earlier version', (done) => {
      compiler.options.upToDate = true
      compiler.plugin = (name, callback) => {
        callback(() => {
          expect(compiler.options.upToDate).to.equal(true)
          done()
        })
      }
      new CheckVersion().apply(compiler, {
        version: '1.11.0'
      })
    })
  })
})

describe('test htmlLoader', () => {
  let content;

  before((done) => {
    fs.readFile(path.join(
      __dirname,
      'mock-ep-app/index.html'
    ), (err, data) => {
      content = data.toString();
      done(err);
    })
  });

  it('contain css inject', (done) => {
    let output = hl.call({}, content);
    expect(output).to.contain('<!--§script_inject!entry.js§§--><script');
    expect(output).to.contain('<div id="slide">\\r\\n  <img src="');
    expect(output).to.contain('\\r\\n  <!--§css_inject_h§  §-->');
    expect(output).to.contain('<!--§script§entry.js§-->');
    expect(output).to.contain('require("./image1.png")');
    expect(typeof content).to.equal('string');
    done();
  })
});

describe('test spritePlugin', () => {
  var expr = sap.patternExpr;

  it('correct pattern expr', (done) => {
    expect(expr.test('images/*.png')).to.equal(true);
    expect(expr.test('./images/*.png')).to.equal(true);
    expect(expr.test('~images/*.png')).to.equal(true);
    done();
  })
});

describe('test urlLoader', () => {
  var mimeTypes = ul.mimeTypes;

  it('correct mimeTypes', (done) => {
    expect(mimeTypes('image.png')).to.equal('image/png');
    expect(mimeTypes('image.jpeg')).to.equal('image/jpeg');
    expect(mimeTypes('image.jpg')).to.equal('image/jpeg');
    expect(mimeTypes('image.gif')).to.equal('image/gif');
    expect(mimeTypes('image.svg')).to.equal('image/svg+xml');
    expect(mimeTypes('font.eot')).to.equal('application/octet-stream');
    expect(mimeTypes('font.ttf')).to.equal('application/octet-stream');
    expect(mimeTypes('font.ttf')).to.equal('application/octet-stream');
    expect(mimeTypes('font.woff')).to.equal('application/octet-stream');
    expect(mimeTypes('font.woff2')).to.equal('application/octet-stream');
    done();
  })
});


describe('test easepack-config', () => {
  var config = require('../../bin/easepack-config');

  describe('#setIfUndefined', () => {
    it('will set the value if user not modified it', (done) => {
      var olduseEs2015 = config.useEs2015
      config.setIfUndefined('useEs2015', !olduseEs2015)
      expect(config.useEs2015).to.equal(!olduseEs2015);
      done()
    })

    it('will ignore if user modified it', (done) => {
      var useEs2015_1 = config.useEs2015
      var useEs2015_2 = !config.useEs2015
      config.set('useEs2015', useEs2015_2)
      config.setIfUndefined('useEs2015', useEs2015_1)
      expect(config.useEs2015).to.equal(useEs2015_2);
      done()
    })
  })

  describe('#matchProps.within', () => {
    it('match files without within-method', (done) => {
      config.match('*.css', {});
      config.match('*.js').within('css', {url: '[name].css'});
      expect(config.matches[1].props._css_.url).to.equal('[name].css');
      done();
    })
  })

  it('should set resolve context path', () => {
    config.set('context', 'E:/')
    expect(config.context).to.equal('E:/')
    config.set('context', '../')
    expect(config.context).to.equal(path.resolve('../'))
  })

  it('should set plain object as value correctly', () => {
    config.set('alias', {a: 1})
    config.set('filename', {chunk: '_c_'})
    expect(config.alias).to.deep.equal({a: 1})
    expect(config.filename).to.deep.equal({chunk: '_c_'})
    config.set('alias', {b: 2})
    config.set('filename', {b: 2})
    expect(config.alias).to.deep.equal({a: 1, b: 2})
    expect(config.filename).to.deep.equal({chunk: '_c_', b: 2})
  })
})