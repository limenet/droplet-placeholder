const { minify } = require('html-minifier');
const request = require('sync-request');
const md5 = require('md5');
const path = require('path');
const fs = require('fs-extra');

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
  const fileExists = fs.existsSync(file);
  return fileExists ? new Date() - new Date(fs.statSync(file).ctime) > cacheLifetime : true;
}

function DownloadException(url, code) {
  this.message = 'Failed to download';
  this.url = url;
  this.code = code;
  this.toString = () => `[${this.code}] ${this.message} ${this.url}`;
}

function downloadImageAsBase64(url, contentType = null) {
  const req = request('GET', url, { encoding: null });
  if (req.statusCode >= 400) {
    throw new DownloadException(url, req.statusCode);
  }
  const base64 = `data:${contentType || req.headers['content-type']};base64,${Buffer.from(
    req.body,
  ).toString('base64')}`;
  return base64;
}

module.exports = {
  cacheDir: 'cache',

  minifyHtml(html) {
    return minify(html, htmlMinifyConfig);
  },

  css() {
    const cssFile = fs.readFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', 'utf8');
    return cssFile;
  },

  image(url, contentType = null) {
    const hash = md5(url + contentType);
    const cache = path.join(this.cacheDir, hash);
    if (isCacheExpired(cache)) {
      fs.outputFileSync(cache, downloadImageAsBase64(url, contentType));
    }
    return fs.readFileSync(cache);
  },
  DownloadException,
};
