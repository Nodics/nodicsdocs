'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'data', 'core');
const target = path.join(root, '.work', 'local-import');

if (!fs.existsSync(path.join(source, 'headers')) || !fs.existsSync(path.join(source, 'data'))) {
    throw new Error('Generated content pack is missing; run npm run build first');
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, {
    recursive: true,
    filter: entry => !entry.includes(`${path.sep}success${path.sep}`) &&
        !entry.includes(`${path.sep}failed${path.sep}`)
});

console.log(target);
