const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');
const build = require('./build');

const watched = [build.directories.configs, build.directories.templates];

watched.forEach((dir) => {
  fs.watch(dir, { recursive: true }, (event, filename) => {
    if (filename && path.basename(filename).startsWith('.')) return;
    console.info(`${event}: ${path.join(dir, filename ?? '')}`);
    exec('npm run build', () => {
      console.info('ran build');
    });
  });
});
