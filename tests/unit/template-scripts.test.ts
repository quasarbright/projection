import * as fs from 'fs';
import * as path from 'path';

const scriptsDir = path.join(__dirname, '../../src/templates/default/scripts');

describe('default template scripts', () => {
  // Tag buttons contain a <sup> count. A tap on the count makes e.target the <sup>, which has
  // no data-tag, so the handler must read the tag from the button it is bound to.
  it('reads the tag from the clicked button, not the inner element', () => {
    const filter = fs.readFileSync(path.join(scriptsDir, 'filter.js'), 'utf8');
    expect(filter).not.toMatch(/toggleTagFilter\(e\.target\.dataset\.tag\)/);
    expect(filter).toMatch(/toggleTagFilter\(e\.currentTarget\.dataset\.tag\)/);
  });
});
