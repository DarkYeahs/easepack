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
      ]
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
        expect(config.resolve.alias).to.deep.equal({
          mixin: path.join(options.privateRepo, 'mixin.scss'),
          vuxDivider: path.join(options.privateRepo, 'vuxDivider@1')
        });
        done();
      });
    }
    new Rap().apply(compiler);
  })

  it('correct resolve alias', (done) => {
    compiler.plugin = (name, callback) => {
      callback(() => {
        expect(typeof compiler.options.ipv4).to.equal('string');
        done();
      });
    }
    new Rip().apply(compiler);
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
    expect(output).to.contain('\\r\\n  <!--@css_inject_h@  @-->');
    expect(output).to.contain('<!--@script@entry.js@-->');
    expect(output).to.contain('require("./image1.png")');
    expect(typeof content).to.equal('string');
    done();
  })
});

describe('test spritePlugin', () => {
  var expr = sap.patternExpr;

  it('correct pattern expr', (done) => {
    expect(expr.test('images/*.png')).to.equal(true);
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