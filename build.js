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

function imageFromUrlToBase64(url, contentType = null) {
    const cacheDir = 'cache';
    const hash = md5(url + contentType);
    const cache = path.join(cacheDir, hash);
    const cacheLifetime = 60 * 60 * 1000;
    const fileExists = fs.existsSync(cache);
    const cacheInvalid =
        fileExists
        ? (new Date()) - new Date(fs.statSync(cache).ctime) > cacheLifetime
        : true;
    if (cacheInvalid) {
        const req = request('GET', url, { encoding: null });
        if (req.statusCode === 200) {
            fs.outputFileSync(cache, `data:${contentType || req.headers['content-type']};base64,${new Buffer(req.body).toString('base64')}`);
        } else {
            log.error(`Failed to download ${url}`);
            return '';
        }
    }

    return fs.readFileSync(cache);
}

glob('configs/*.json', (err0, files) => {
    if (err0) log.error(err0);
    for (let i = files.length - 1; i >= 0; i -= 1) {
        const file = files[i];

        const images = {
            limenetch: imageFromUrlToBase64('https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png'),
            digitalocean: imageFromUrlToBase64('https://s3.amazonaws.com/multisite-misc-assets/do-hosted-by.png'),
            faCode: imageFromUrlToBase64('https://raw.githubusercontent.com/encharm/Font-Awesome-SVG-PNG/master/black/svg/code.svg', 'image/svg+xml'),
        };

        fs.readJson(file, (err1, c) => {
            const config = c;
            Object.entries(images).forEach(([key, value]) => {
                config[key] = value;
            });

            if ('gravatar' in config) {
                config.gravatar = imageFromUrlToBase64(`https://www.gravatar.com/avatar/${config.gravatar}?rating=G&size=256`);
            }

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
