const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const build = require('../src/build');

function cleanOutput() {
  fs.readdirSync(build.directories.output)
    .filter((f) => f.endsWith('.html'))
    .forEach((f) => fs.unlinkSync(path.join(build.directories.output, f)));
}

function countConfig() {
  return fs
    .readdirSync(build.directories.configs)
    .filter((f) => f.endsWith('.json')).length;
}

function countOutput() {
  return fs
    .readdirSync(build.directories.output)
    .filter((f) => f.endsWith('.html')).length;
}

describe('build', () => {
  before(async () => {
    cleanOutput();
    await build.main();
  });

  it('generates output files', () => {
    assert(countOutput() > 1);
  });

  it('compiles each config', () => {
    assert.strictEqual(countOutput(), countConfig());
  });
});
