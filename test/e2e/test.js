import fs from 'fs'
import path from 'path'
import { expect } from 'chai'

import hl from '../../lib/plugins/htmlLoader';

describe('test html loader', () => {
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

  it('parse', (done) => {
    console.log(hl.call({}, content))
    expect(typeof content).to.equal('string');
    done();
  })
});