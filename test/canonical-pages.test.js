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

test('search journey covers engines, provider extension, lifecycle, import, export, and operations', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.query-modeling.overview',
        'capability.query-modeling.concepts',
        'capability.query-modeling.tutorial',
        'capability.query-modeling.technical-reference',
        'capability.search-indexing.overview',
        'capability.search-indexing.prebuilt-engines',
        'capability.search-indexing.provider-development',
        'capability.search-indexing.lifecycle',
        'capability.search-indexing.import-export',
        'capability.search-indexing.operations',
        'capability.search-indexing.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.search-indexing.prebuilt-engines'), /Elasticsearch/);
    assert.match(serialized('capability.search-indexing.overview'), /OpenSearch/);
    assert.match(serialized('capability.search-indexing.overview'), /Solr/);
    assert.match(serialized('capability.search-indexing.provider-development'), /provider module/i);
    assert.match(serialized('capability.search-indexing.lifecycle'), /reconcil/i);
    assert.match(serialized('capability.search-indexing.import-export'), /nImport/);
    assert.match(serialized('capability.search-indexing.import-export'), /nExport/);
    assert.match(serialized('capability.search-indexing.operations'), /production qualification/i);
});

test('provider documentation standard governs every external adapter family', () => {
    const standard = fs.readFileSync(
        path.join(root, 'docs', 'provider-documentation-standard.md'),
        'utf8'
    );
    [
        'database',
        'cache',
        'search',
        'messaging',
        'AI',
        'storage',
        'identity',
        'notification',
        'payment'
    ].forEach(capability => assert.match(standard, new RegExp(capability, 'i')));
    [
        'provider-neutral',
        'Prebuilt providers',
        'Building a provider',
        'Lifecycle and resilience',
        'Import and export interaction',
        'Cross-capability assessment',
        'Operations and verification'
    ].forEach(section => assert.match(standard, new RegExp(section, 'i')));
});
