/* eslint-env node, mocha */
const assert = require('assert');
const helpers = require('../src/helpers');

describe('Images', () => {
    const url = 'https://s3.amazonaws.com/limenet-logo-img/v2/full-transparent-height20.png';
    it('return something', () => {
        assert(helpers.image(url) !== '');
    });
});
