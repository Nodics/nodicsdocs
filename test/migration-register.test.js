'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { suggestedCapability } = require('../scripts/build-migration-register');

const root = path.resolve(__dirname, '..');
const taxonomy = JSON.parse(
    fs.readFileSync(path.join(root, 'source', 'navigation-taxonomy.json'), 'utf8')
);
const canonicalPages = JSON.parse(
    fs.readFileSync(path.join(root, 'source', 'canonical-pages.json'), 'utf8')
);
const register = JSON.parse(
    fs.readFileSync(path.join(root, 'manifest', 'migration-register.json'), 'utf8')
);
const migrationManifest = JSON.parse(
    fs.readFileSync(path.join(root, 'manifest', 'documentation-manifest.json'), 'utf8')
);

test('taxonomy has explicit unique ordering and capability-first names', () => {
    assert.equal(new Set(taxonomy.sections.map(section => section.code)).size, taxonomy.sections.length);
    assert.equal(new Set(taxonomy.sections.map(section => section.order)).size, taxonomy.sections.length);
    assert.equal(
        new Set(taxonomy.capabilities.map(capability => capability.order)).size,
        taxonomy.capabilities.length
    );
    assert.equal(taxonomy.capabilities.some(capability => capability.title === 'nConfig'), false);
    assert.equal(
        taxonomy.capabilities.find(capability => capability.code === 'configuration').title,
        'Nodics Configuration Layer'
    );
});

test('migration register accounts for every discovered source', () => {
    assert.equal(register.sources.nodics, migrationManifest.articleCount);
    assert.equal(register.sources.wordpress, 25);
    assert.equal(register.entries.length, register.sources.total);
    assert.equal(new Set(register.entries.map(entry => entry.evidenceId)).size, register.entries.length);
    assert.equal(
        register.review.reviewed + register.review.pending,
        register.entries.length
    );
    assert.deepEqual(register.review.unknownDecisionIds, []);
});

test('reviewed destinations use canonical capability-first page identities', () => {
    const destinationCodes = new Set(canonicalPages.pages.map(page => page.code));
    const reviewed = register.entries.filter(entry => entry.reviewStatus === 'reviewed');
    assert.equal(reviewed.length > 300, true);
    reviewed.filter(entry => entry.destinationCode).forEach(entry => {
        assert.equal(destinationCodes.has(entry.destinationCode), true, entry.evidenceId);
    });
    assert.equal(
        canonicalPages.pages.some(page => /^n[A-Z]/.test(page.title)),
        false
    );
});

test('specialized application packages have explicit solution ownership', () => {
    const byPath = new Map(register.entries.map(entry => [entry.sourcePath, entry]));
    assert.equal(
        byPath.get('gOptional/kyc/README.md').destinationCode,
        'solution.kyc.technical-reference'
    );
    assert.equal(
        byPath.get('gCore/quizer/README.md').destinationCode,
        'solution.learning-assessment.technical-reference'
    );
    assert.equal(
        byPath.get('gMrkty/cres/README.md').destinationCode,
        'solution.customer-reviews.technical-reference'
    );
});

test('capability suggestions are advisory and reproducible', () => {
    assert.equal(suggestedCapability({
        title: 'How cache works',
        route: '/docs/platform/cache',
        source: { path: 'gDocs/platform/how-cache-works.md' },
        headings: []
    }, taxonomy), 'caching');
    assert.equal(suggestedCapability({
        title: 'Unclassified historical page',
        route: '/legacy/example',
        source: { path: 'example' },
        headings: []
    }, taxonomy), null);
});
