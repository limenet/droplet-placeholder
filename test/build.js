/* eslint-env node, mocha */
const assert = require('assert');
const build = require('../src/build');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const { exec } = require('child_process');

describe('build', () => {
    function cleanOutput() {
        glob(path.join(build.directories.output, '*.html'), (err0, files) => {
            Object.values(files).forEach((file) => {
                fs.unlink(file);
            });
        });
    }

    function countConfig() {
        return fs.readdirSync(build.directories.configs);
    }

    function countOutput() {
        return fs.readdirSync(build.directories.output);
    }

    it('generates output files', () => {
        cleanOutput();
        exec('yarn run build', () => {
            assert(countOutput() > 1);
        });
    });

    it('compiles each config', () => {
        cleanOutput();
        exec('yarn run build', () => {
            assert.equals(countOutput(), countConfig());
        });
    });
});
