const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const helpers = require('../src/helpers');

const url =
  'https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png';
const mimeType = 'image/svg+xml';

const dataUriRegex = /^data:([^;]+);([^,]+),(.*)$/s;

describe('image()', () => {
  it('caches the response', async () => {
    fs.rmSync(helpers.cacheDir, { recursive: true, force: true });

    assert.notStrictEqual(await helpers.image(url), '');

    assert(fs.readdirSync(helpers.cacheDir).length > 0);
  });

  it('respects custom MIME type', async () => {
    const match = (await helpers.image(url, mimeType)).match(dataUriRegex);
    assert.strictEqual(match[1], mimeType);
  });

  it('contains a MIME type', async () => {
    const match = (await helpers.image(url)).match(dataUriRegex);
    assert.match(match[1], /^[\w.+-]+\/[\w.+-]+$/);
  });

  it('contains base64 header', async () => {
    const match = (await helpers.image(url)).match(dataUriRegex);
    assert.strictEqual(match[2], 'base64');
  });

  it('is in base64', async () => {
    const match = (await helpers.image(url)).match(dataUriRegex);
    assert.doesNotThrow(() => Buffer.from(match[3], 'base64'));
  });

  it('fails with exception', async () => {
    await assert.rejects(() => helpers.image('https://example.com/404.jpg'));
  });
});

describe('css()', () => {
  it('returns valid CSS', () => {
    const css = helpers.css();
    assert(typeof css === 'string' && css.length > 0);
    assert.match(css, /\{[^}]*\}/);
  });
});

describe('minifyHtml()', () => {
  it('collapses whitespace', async () => {
    const out = await helpers.minifyHtml('<p>   hello   </p>');
    assert(out.includes('hello'));
    assert(!out.includes('   '));
  });
});
