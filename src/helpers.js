const { minify } = require('html-minifier-terser');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const cacheLifetime = 7 * 24 * 60 * 60 * 1000;

const htmlMinifyConfig = {
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
};

function isCacheExpired(file) {
  return fs.existsSync(file)
    ? new Date() - new Date(fs.statSync(file).ctime) > cacheLifetime
    : true;
}

function DownloadException(url, code) {
  this.message = 'Failed to download';
  this.url = url;
  this.code = code;
  this.toString = () => `[${this.code}] ${this.message} ${this.url}`;
}

async function downloadImageAsBase64(url, contentType = null) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new DownloadException(url, res.status);
  }
  const imgBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  const imgType = contentType || res.headers.get('content-type');
  return `data:${imgType};base64,${imgBase64}`;
}

module.exports = {
  cacheDir: 'cache',

  async minifyHtml(html) {
    return minify(html, htmlMinifyConfig);
  },

  css() {
    return fs.readFileSync('node_modules/water.css/out/water.min.css', 'utf8');
  },

  async image(url, contentType = null) {
    const hash = crypto
      .createHash('md5')
      .update(url + contentType)
      .digest('hex');
    const cache = path.join(this.cacheDir, hash);
    if (isCacheExpired(cache)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(cache, await downloadImageAsBase64(url, contentType));
    }
    return fs.readFileSync(cache, 'utf8');
  },
  DownloadException,
};
