const chokidar = require('chokidar');
const build = require('./build');
const { exec } = require('child_process');
const log = require('cedar')();

chokidar.watch([build.directories.configs, build.directories.templates], {
    // eslint-disable-next-line no-useless-escape
    ignored: /(^|[\/\\])\../,
    persistent: true,
}).on('all', (event, path) => {
    log.log(`${event}: ${path}`);
    exec('yarn run build', () => {
        log.info('ran build');
    });
});
