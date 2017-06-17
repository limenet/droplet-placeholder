/* eslint-env node, mocha */
const assert = require('assert');
const helpers = require('../src/helpers');
const mime = require('mime-types');
const fs = require('fs-extra');
const cssParser = require('css');

describe('image()', () => {
    const url = 'https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png';

    it('caches the response', () => {
        fs.emptyDirSync(helpers.cacheDir);

        assert.notEqual(helpers.image(url), '');

        fs.readdir(helpers.cacheDir, (err, items) => {
            assert(items.length > 1);
        });
    });

    it('respects custom MIME type', () => {
        const mimeType = 'image/svg+xml';
        const regex = 'data:(.*);';
        const image = helpers.image(url, mimeType).toString();
        const match = image.match(regex);
        assert.equal(match[1], mimeType);
    });

    it('contains MIME type', () => {
        const regex = 'data:(.*);';
        const image = helpers.image(url).toString();
        const match = image.match(regex);
        assert.notEqual(mime.extension(match[1]), '');
    });

    it('contains base64 header', () => {
        const regex = '^data:(.*);(.*),';
        const image = helpers.image(url).toString();
        const match = image.match(regex);
        assert.equal(match[2], 'base64');
    });

    it('is in base64', () => {
        const regex = '^data:(.*);(.*),(.*)';
        const image = helpers.image(url).toString();
        const match = image.match(regex);
        Buffer.from(match[3], 'base64');
    });

    it('fails gracefully', () => {
        assert.equal(helpers.image('https://example.com/404.jpg'), '');
    });
});

describe('css()', () => {
    it('returns valid CSS', () => {
        assert.doesNotThrow(() => { cssParser.parse(helpers.css('')); });
    });

    it('strips comments and @font-face', () => {
        assert.doesNotThrow(() => {
            Object.values(cssParser.parse(helpers.css('')).stylesheet.rules).forEach((rule) => {
                assert.notEqual(rule.type, 'comment');
                assert.notEqual(rule.type, 'font-face');
            });
        });
    });
});