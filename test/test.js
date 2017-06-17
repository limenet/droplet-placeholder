/* eslint-env node, mocha */
const assert = require('assert');
const helpers = require('../src/helpers');
const mime = require('mime-types');
const fs = require('fs-extra');

describe('Images', () => {
    const url = 'https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png';

    it('caches the response', () => {
        fs.emptyDirSync(helpers.cacheDir);

        assert(helpers.image(url) !== '');

        fs.readdir(helpers.cacheDir, (err, items) => {
            assert(items.length > 1);
        });
    });

    it('returns something', () => {
        assert(helpers.image(url) !== '');
    });

    it('respects custom MIME type', () => {
        const mimeType = 'image/svg+xml';
        const regex = 'data:(.*);';
        const image = helpers.image(url, mimeType).toString();
        const match = image.match(regex);
        assert(match[1] === mimeType);
    });

    it('contains MIME type', () => {
        const regex = 'data:(.*);';
        const image = helpers.image(url).toString();
        const match = image.match(regex);
        assert(mime.extension(match[1]) !== '');
    });

    it('contains base64 header', () => {
        const regex = '^data:(.*);(.*),';
        const image = helpers.image(url).toString();
        const match = image.match(regex);
        assert(match[2] === 'base64');
    });

    it('is in base64', () => {
        const regex = '^data:(.*);(.*),(.*)';
        const image = helpers.image(url).toString();
        const match = image.match(regex);
        Buffer.from(match[3], 'base64');
    });

    it('fails gracefully', () => {
        assert(helpers.image('https://example.com/404.jpg') === '');
    });
});
