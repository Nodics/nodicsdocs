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

test('framework foundation journey covers configuration, layers, schemas, and validation', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.configuration.overview',
        'capability.configuration.business-value',
        'capability.configuration.runtime',
        'capability.configuration.customization',
        'capability.configuration.technical-reference',
        'capability.layered-architecture.overview',
        'capability.layered-architecture.ownership',
        'capability.layered-architecture.runtime',
        'capability.layered-architecture.customization',
        'capability.layered-architecture.technical-reference',
        'capability.schema-modeling.overview',
        'capability.schema-modeling.runtime',
        'capability.schema-modeling.relationships',
        'capability.schema-modeling.tutorial',
        'capability.schema-modeling.technical-reference',
        'capability.validation.overview',
        'capability.validation.layers',
        'capability.validation.runtime',
        'capability.validation.tutorial',
        'capability.validation.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));
});

test('framework foundation content preserves authority and customization contracts', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    const serialized = code => JSON.stringify(byCode.get(code));

    assert.match(serialized('capability.configuration.customization'), /package\.json/);
    assert.match(serialized('capability.configuration.runtime'), /rollback/i);
    assert.match(serialized('capability.layered-architecture.ownership'), /duplicate authority/i);
    assert.match(serialized('capability.layered-architecture.runtime'), /monoServer/);
    assert.match(serialized('capability.schema-modeling.runtime'), /base properties are composed at runtime/i);
    assert.match(serialized('capability.schema-modeling.relationships'), /different modules/i);
    assert.match(serialized('capability.schema-modeling.tutorial'), /database client/i);
    assert.match(serialized('capability.validation.overview'), /service-to-service/i);
    assert.match(serialized('capability.validation.layers'), /frontend/i);
    ['positive', 'negative', 'boundar', 'contract', 'integration', 'regression'].forEach(testKind => {
        assert.match(
            serialized('capability.validation.tutorial'),
            new RegExp(testKind, 'i')
        );
    });
});

test('provider-integrated capability journey covers persistence, cache, events, import, and export', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.persistence.overview',
        'capability.persistence.prebuilt-providers',
        'capability.persistence.provider-development',
        'capability.persistence.lifecycle',
        'capability.persistence.operations',
        'capability.persistence.technical-reference',
        'capability.caching.overview',
        'capability.caching.prebuilt-providers',
        'capability.caching.provider-development',
        'capability.caching.lifecycle',
        'capability.caching.operations',
        'capability.caching.technical-reference',
        'capability.events-messaging.overview',
        'capability.events-messaging.delivery',
        'capability.events-messaging.provider-development',
        'capability.events-messaging.lifecycle',
        'capability.events-messaging.operations',
        'capability.events-messaging.technical-reference',
        'capability.data-exchange.guide',
        'capability.data-exchange.import',
        'capability.data-exchange.export',
        'capability.data-exchange.provider-development',
        'capability.data-exchange.lifecycle',
        'capability.data-exchange.operations',
        'capability.data-exchange.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));
});

test('provider-integrated pages preserve maturity and cross-capability truth', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    const serialized = code => JSON.stringify(byCode.get(code));

    assert.match(serialized('capability.persistence.prebuilt-providers'), /standalone local server is not transaction-qualified/i);
    assert.match(serialized('capability.persistence.provider-development'), /generic DAO/i);
    assert.match(serialized('capability.caching.prebuilt-providers'), /fail-closed extension slot/i);
    assert.match(serialized('capability.caching.lifecycle'), /authoritative/i);
    assert.match(serialized('capability.events-messaging.delivery'), /local listener call is not durable messaging/i);
    assert.match(serialized('capability.events-messaging.provider-development'), /provider-neutral EMS contract/i);
    assert.match(serialized('capability.data-exchange.import'), /arbitrary request URLs and credentials are forbidden/i);
    assert.match(serialized('capability.data-exchange.export'), /fails closed/i);
    assert.match(serialized('capability.data-exchange.lifecycle'), /No parallel authority/i);
    [
        'capability.persistence.technical-reference',
        'capability.caching.technical-reference',
        'capability.events-messaging.technical-reference',
        'capability.data-exchange.technical-reference'
    ].forEach(code => {
        ['positive', 'negative', 'boundar', 'contract', 'integration', 'regression'].forEach(testKind => {
            assert.match(serialized(code), new RegExp(testKind, 'i'), `${code}:${testKind}`);
        });
    });
});
