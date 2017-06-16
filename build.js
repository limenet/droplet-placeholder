const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');
const minify = require('html-minifier').minify;
const purifycss = require('purify-css');
const log = require('chip')();

glob('configs/*.json', (err0, files) => {
    if (err0) log.error(err0);
    for (let i = files.length - 1; i >= 0; i -= 1) {
        const file = files[i];
        fs.readJson(file, (err1, config) => {
            if (err1) log.error(err1);

            const template = `templates/${config.template}.html`;
            const html = `public/${path.basename(file, '.json')}.html`;

            let data = '';
            mu.clearCache();
            mu.compileAndRender(template, config)
                .on('data', (d) => {
                    data += d.toString();
                }).on('end', () => {
                    const bootstrap = fs.readFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', 'utf8');
                    purifycss(data, bootstrap, { minify: true }, (css) => {
                        data = data.replace('<style></style>', `<style>${css}</style>`);
                        try {
                            data = minify(data, {
                                collapseWhitespace: true,
                                collapseBooleanAttributes: true,
                                collapseInlineTagWhitespace: true,
                                decodeEntities: true,
                                minifyCSS: true,
                                minifyJS: true,
                                minifyURLs: true,
                                removeComments: true,
                                removeEmptyAttributes: true,
                                removeOptionalTags: true,
                                removeRedundantAttributes: true,
                                removeScriptTypeAttributes: true,
                                removeStyleLinkTypeAttributes: true,
                                useShortDoctype: true,
                            });
                        } catch (err) {
                            log.error(`Minification failed for ${file}`);
                        }
                        fs.writeFile(html, data);
                        log.info(path.basename(file));
                    });
                });
        });
    }
});
