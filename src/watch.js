const chokidar = require('chokidar');
const { exec } = require('child_process');
const log = require('cedar')();
const build = require('./build');

chokidar
  .watch([build.directories.configs, build.directories.templates], {
    // eslint-disable-next-line no-useless-escape
    ignored: /(^|[\/\\])\../,
    persistent: true,
  })
  .on('all', (event, path) => {
    log.log(`${event}: ${path}`);
    exec('yarn run build', () => {
      log.info('ran build');
    });
  });
