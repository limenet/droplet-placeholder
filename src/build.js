const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');
const log = require('chip')();
const helpers = require('./helpers');

const directories = {
    output: 'public',
    templates: 'templates',
    configs: 'configs',
};

glob(path.join(directories.configs, '*.json'), (err0, files) => {
    if (err0) log.error(err0);

    Object.values(files).forEach((file) => {
        const images = {
            limenetch: helpers.image('https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png'),
            digitalocean: helpers.image('https://s3.amazonaws.com/multisite-misc-assets/do-hosted-by.png'),
            faCode: helpers.image('https://raw.githubusercontent.com/encharm/Font-Awesome-SVG-PNG/master/black/svg/code.svg', 'image/svg+xml'),
        };

        fs.readJson(file, (err1, c) => {
            if (err1) log.error(err1);

            const config = c;
            const basename = path.basename(file, '.json');

            Object.entries(images).forEach(([key, value]) => {
                config[key] = value;
            });

            if ('gravatar' in config) {
                config.gravatar = helpers.image(`https://www.gravatar.com/avatar/${config.gravatar}?rating=G&size=256`);
            }

            const template = path.join(directories.templates, `${config.template}.html`);
            const html = path.join(directories.output, `${basename}.html`);

            let data = '';
            mu.compileAndRender(template, config)
                .on('data', (d) => {
                    data += d.toString();
                })
                .on('end', () => {
                    data = data.replace('<style></style>', `<style>${helpers.css(data)}</style>`);
                    try {
                        data = helpers.minifyHtml(data);
                    } catch (err) {
                        log.error(`Minification failed for ${file}`);
                    }
                    fs.writeFile(html, data, (err2) => {
                        if (err2) log.error(err2);

                        log.info(basename);
                    });
                });
        });
    });
});

module.exports = {
    directories,
};
