const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const log = require('cedar')();
const mustache = require('mustache');
const helpers = require('./helpers');

const directories = {
  output: 'public',
  templates: 'templates',
  configs: 'configs',
};

function outputHtml(file, data) {
  const basename = path.basename(file, '.html');
  let d = data;
  d = d.replace('<style></style>', `<style>${helpers.css(d)}</style>`);
  d = helpers.minifyHtml(d);
  fs.writeFile(file, d, (err2) => {
    if (err2) log.error(err2);

    log.info(basename);
  });
}

function renderTemplate(file, config) {
  const basename = path.basename(file, '.json');
  const template = path.join(directories.templates, `${config.template}.html`);
  const out = path.join(directories.output, `${basename}.html`);

  const data = mustache.render(fs.readFileSync(template, 'utf8'), config);
  outputHtml(out, data);
}

function parseConfig(file) {
  fs.readJson(file, (err1, c) => {
    if (err1) log.error(err1);
    const images = {
      limenetch: helpers.image(
        'https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png',
      ),
      digitalocean: helpers.image(
        'https://s3.amazonaws.com/multisite-misc-assets/DO_Powered_by_Badge_black.svg',
      ),
      faCode: helpers.image(
        'https://raw.githubusercontent.com/encharm/Font-Awesome-SVG-PNG/master/black/svg/code.svg',
        'image/svg+xml',
      ),
    };

    const config = c;
    config.images = images;

    if ('gravatar' in c) {
      config.gravatar = helpers.image(
        `https://www.gravatar.com/avatar/${c.gravatar}?rating=G&size=256`,
      );
    }

    renderTemplate(file, c);
  });
}

glob(path.join(directories.configs, '*.json'), (err0, files) => {
  if (err0) log.error(err0);

  Object.values(files).forEach((file) => {
    parseConfig(file);
  });
});

module.exports = {
  directories,
};
