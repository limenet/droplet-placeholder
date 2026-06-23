const fs = require('node:fs');
const path = require('node:path');
const mustache = require('mustache');
const helpers = require('./helpers');

const directories = {
  output: 'public',
  templates: 'templates',
  configs: 'configs',
};

async function outputHtml(file, data) {
  const basename = path.basename(file, '.html');
  let d = data;
  d = d.replace('<style></style>', `<style>${helpers.css()}</style>`);
  d = await helpers.minifyHtml(d);
  fs.writeFileSync(file, d);
  console.info(basename);
}

async function renderConfig(file) {
  const basename = path.basename(file, '.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = path.join(directories.output, `${basename}.html`);

  config.images = {
    limenetch: await helpers.image(
      'https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png'
    ),
  };

  if ('gravatar' in config) {
    config.gravatar = await helpers.image(
      `https://www.gravatar.com/avatar/${config.gravatar}?rating=G&size=256`
    );
  }

  const template = path.join(directories.templates, `${config.template}.html`);
  const data = mustache.render(fs.readFileSync(template, 'utf8'), config);
  await outputHtml(out, data);
}

async function main() {
  const files = fs
    .readdirSync(directories.configs)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(directories.configs, f));

  await Promise.all(files.map((file) => renderConfig(file)));

  fs.cpSync(
    path.join(__dirname, '..', '_redirects'),
    path.join(directories.output, '_redirects')
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  directories,
  main,
};
