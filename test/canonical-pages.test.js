'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { walkFiles } = require('../scripts/lib/content-utils');

const root = path.resolve(__dirname, '..');
const pages = walkFiles(
    path.join(root, 'source', 'pages'),
    filePath => filePath.endsWith('.json')
).map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));

test('first canonical journey covers discovery through framework learning', () => {
    const codes = new Set(pages.map(page => page.code));
    [
        'discover.overview',
        'evaluate.capabilities',
        'evaluate.checklist',
        'evaluate.comparison',
        'evaluate.security-trust',
        'evaluate.value',
        'getting-started.setup',
        'getting-started.first-capability',
        'framework.architecture'
    ].forEach(code => assert.equal(codes.has(code), true, code));
});

test('canonical pages use capability names and explicit ordered navigation', () => {
    pages.forEach(page => {
        assert.equal(page.title.startsWith('nConfig'), false);
        assert.equal(Number.isInteger(page.order), true);
        assert.equal(page.route.startsWith('/docs/'), true);
    });
});
