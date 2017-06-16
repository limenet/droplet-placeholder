const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');
const minify = require('html-minifier').minify;
const purifycss = require('purify-css');
const log = require('chip')();
const cssParser = require('css');

function minifyHtml(html) {
    return minify(html, {
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
}

function css(data) {
    const cssFile = fs.readFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', 'utf8');
    return purifycss(data, cssFile, { minify: true }, (result) => {
        const cssAst = cssParser.parse(result);
        const rules = [];
        for (let j = cssAst.stylesheet.rules.length - 1; j >= 0; j -= 1) {
            const ruleType = cssAst.stylesheet.rules[j].type;
            const disallowedTypes = ['comment', 'font-face', 'keyframes'];
            if (!disallowedTypes.includes(ruleType)) {
                rules.push(cssAst.stylesheet.rules[j]);
            }
        }
        cssAst.stylesheet.rules = rules;

        return cssParser.stringify(cssAst);
    });
}


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
                    data = data.replace('<style></style>', `<style>${css(data)}</style>`);
                    try {
                        data = minifyHtml(data);
                    } catch (err) {
                        log.error(`Minification failed for ${file}`);
                    }
                    fs.writeFile(html, data);
                    log.info(path.basename(file));
                });
        });
    }
});
