const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');
const minify = require('html-minifier').minify;

glob('configs/*.json', (err0, files) => {
    if (err0) console.error(err0);
    for (let i = files.length - 1; i >= 0; i -= 1) {
        const file = files[i];
        fs.readJson(file, (err1, template) => {
            if (err1) console.error(err1);

            const outFile = path.join(__dirname, '/public/', `index-${path.basename(file, '.json')}.html`);

            console.log(template);

            mu.clearCache();
            const stream = mu.compileAndRender(path.join(__dirname, 'template.html'), template);
            const writable = fs.createWriteStream(outFile);
            stream.pipe(writable);
            stream.on('end', () => {
                fs.readFile(outFile, (err2, data) => {
                    if (err2) console.error(err2);
                    fs.writeFile(outFile, minify(data.toString(), {
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
                    }));
                });
            });
        });
    }
});
