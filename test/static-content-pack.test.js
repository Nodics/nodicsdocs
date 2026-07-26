'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('publishes directly importable committed Nodics data', () => {
    const packageMetadata = JSON.parse(
        fs.readFileSync(path.join(root, 'package.json'), 'utf8')
    );
    const release = JSON.parse(
        fs.readFileSync(
            path.join(root, 'manifest', 'generated-content-pack.json'),
            'utf8'
        )
    );
    const header = path.join(
        root,
        'data',
        'core',
        'headers',
        'nodicsDocumentationContentPackHeader.js'
    );
    const catalogData = path.join(
        root,
        'data',
        'core',
        'data',
        'documentation',
        'nodicsDocumentationCatalogData.js'
    );

    assert.equal(packageMetadata.scripts['stage:local'], undefined);
    assert.equal(
        fs.existsSync(path.join(root, 'scripts', 'stage-local-import.js')),
        false
    );
    assert.equal(fs.existsSync(header), true);
    assert.equal(fs.existsSync(catalogData), true);
    assert.equal(
        release.generatedHashes[
            'data/core/headers/nodicsDocumentationContentPackHeader.js'
        ] !== undefined,
        true
    );
    assert.equal(
        release.generatedHashes[
            'data/core/data/documentation/nodicsDocumentationCatalogData.js'
        ] !== undefined,
        true
    );
});
