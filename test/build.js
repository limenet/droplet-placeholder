/* eslint-env node, mocha */
const assert = require('assert');
const fs = require('fs-extra');
const { globSync } = require('glob');
const path = require('path');
const { exec } = require('child_process');
const build = require('../src/build');

describe('build', () => {
  function cleanOutput() {
    const files = globSync(path.join(build.directories.output, '*.html'));
    Object.values(files).forEach((file) => {
      fs.unlink(file);
    });
  }

  function countConfig() {
    return fs.readdirSync(build.directories.configs).length;
  }

  function countOutput() {
    return fs
      .readdirSync(build.directories.output)
      .filter((f) => f.endsWith('.html')).length;
  }

  it('generates output files', () => {
    cleanOutput();
    exec('npm run build', () => {
      assert(countOutput() > 1);
    });
  });

  it('compiles each config', () => {
    cleanOutput();
    exec('npm run build', () => {
      assert(countOutput() === countConfig());
    });
  });
});
