const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mu = require('mu2');

glob('configs/*.json', (error, files) => {
    for (let i = files.length - 1; i >= 0; i -= 1) {
        const file = files[i];
        const template = fs.readJsonSync(file);
        const outFile = path.join(__dirname, '/public/', `index-${path.basename(file, '.json')}.html`);

        console.log(template);

        mu.clearCache();
        const stream = mu.compileAndRender(path.join(__dirname, 'template.html'), template);
        const writable = fs.createWriteStream(outFile);
        stream.pipe(writable);
    }
});
