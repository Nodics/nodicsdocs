'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

test('stages a disposable import without consuming generated authority', () => {
    const generated = path.join(
        root,
        'data',
        'core',
        'data',
        'documentation',
        'nodicsDocumentationCatalogData.js'
    );
    assert.equal(fs.existsSync(generated), true);

    const target = execFileSync(process.execPath, ['scripts/stage-local-import.js'], {
        cwd: root,
        encoding: 'utf8'
    }).trim();

    assert.equal(target, path.join(root, '.work', 'local-import'));
    assert.equal(fs.existsSync(generated), true);
    assert.equal(fs.existsSync(path.join(
        target,
        'data',
        'documentation',
        'nodicsDocumentationCatalogData.js'
    )), true);
});
