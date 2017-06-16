const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');
const minify = require('html-minifier').minify;
const purifycss = require('purify-css');

glob('configs/*.json', (err0, files) => {
    if (err0) console.error(err0);
    for (let i = files.length - 1; i >= 0; i -= 1) {
        const file = files[i];
        fs.readJson(file, (err1, config) => {
            if (err1) console.error(err1);

            const outFile = path.join(__dirname, '/public/', `${path.basename(file, '.json')}.html`);
            const outCss = path.join(__dirname, '/public/', `${path.basename(file, '.json')}.css`);

            let data = '';
            mu.clearCache();
            mu.compileAndRender(path.join(__dirname, `templates/${config.template}.html`), config)
                .on('data', (d) => {
                    data += d.toString();
                }).on('end', () => {
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
                        console.error(`Minification failed for ${file}`);
                    }
                    const bootstrap = fs.readFileSync(path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'), 'utf8');
                    purifycss(data, bootstrap, {
                        output: outCss,
                        minify: true,
                    });
                    fs.writeFile(outFile, data);
                    console.info(`Success for ${file}`);
                });
        });
    }
});
