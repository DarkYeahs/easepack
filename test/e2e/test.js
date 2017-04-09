import fs from 'fs'
import path from 'path'
import { expect } from 'chai'

import hl from '../../lib/plugins/htmlLoader'
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