import fs from 'fs'
import path from 'path'
import { expect } from 'chai'

import hl from '../../lib/plugins/htmlLoader'
import ul from '../../lib/plugins/urlLoader'
import sap from '../../lib/plugins/SassOptionsPlugin'


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