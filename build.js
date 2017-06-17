const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');
const minify = require('html-minifier').minify;
const purifycss = require('purify-css');
const log = require('chip')();
const cssParser = require('css');
const request = require('sync-request');
const md5 = require('md5');

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

function image(url, contentType = null) {
    const cacheDir = 'cache';
    const hash = md5(url + contentType);
    const cache = path.join(cacheDir, hash);
    const cacheLifetime = 7 * 24 * 60 * 60 * 1000;
    const fileExists = fs.existsSync(cache);
    const cacheInvalid =
        fileExists
        ? (new Date()) - new Date(fs.statSync(cache).ctime) > cacheLifetime
        : true;
    if (!cacheInvalid) {
        return fs.readFileSync(cache);
    }
    const req = request('GET', url, { encoding: null });
    if (req.statusCode === 200) {
        const base64 = `data:${contentType || req.headers['content-type']};base64,${new Buffer(req.body).toString('base64')}`;
        fs.outputFile(cache, base64);
        return base64;
    }
    log.error(`Failed to download ${url}`);
    return '';
}

glob('configs/*.json', (err0, files) => {
    if (err0) log.error(err0);

    Object.values(files).forEach((file) => {
        const images = {
            limenetch: image('https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png'),
            digitalocean: image('https://s3.amazonaws.com/multisite-misc-assets/do-hosted-by.png'),
            faCode: image('https://raw.githubusercontent.com/encharm/Font-Awesome-SVG-PNG/master/black/svg/code.svg', 'image/svg+xml'),
        };

        fs.readJson(file, (err1, c) => {
            if (err1) log.error(err1);

            const config = c;
            const basename = path.basename(file, '.json');

            Object.entries(images).forEach(([key, value]) => {
                config[key] = value;
            });

            if ('gravatar' in config) {
                config.gravatar = image(`https://www.gravatar.com/avatar/${config.gravatar}?rating=G&size=256`);
            }

            const template = `templates/${config.template}.html`;
            const html = `public/${basename}.html`;

            let data = '';
            mu.compileAndRender(template, config)
                .on('data', (d) => {
                    data += d.toString();
                })
                .on('end', () => {
                    data = data.replace('<style></style>', `<style>${css(data)}</style>`);
                    try {
                        data = minifyHtml(data);
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
