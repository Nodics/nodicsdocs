'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function records(relativePath) {
    return Object.values(require(path.join(root, relativePath)));
}

test('generated content pack preserves CMS relationships', () => {
    const manifest = JSON.parse(
        fs.readFileSync(path.join(root, 'manifest', 'generated-content-pack.json'), 'utf8')
    );
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const pages = records('data/core/data/documentation/nodicsDocumentationPageData.js');
    const routes = records('data/core/data/documentation/nodicsDocumentationRouteData.js');
    const componentCodes = new Set(components.map(record => record.code));
    const pageCodes = new Set(pages.map(record => record.code));

    assert.strictEqual(components.length, manifest.articles);
    assert.strictEqual(pages.length, manifest.articles);
    assert.strictEqual(routes.length, manifest.routes);
    pages.forEach(page => {
        assert.deepStrictEqual(page.cmsSite, manifest.sites);
        page.cmsComponents.forEach(relation => assert(componentCodes.has(relation.target)));
    });
    routes.forEach(route => {
        assert(pageCodes.has(route.page));
        assert(manifest.sites.includes(route.site));
        assert.strictEqual(route.accessMode, manifest.accessMode);
    });
});

test('generated header targets existing Nodics schema modules', () => {
    const header = require(path.join(
        root,
        'data/core/headers/nodicsDocumentationContentPackHeader.js'
    ));
    assert(header.catalog.nodicsDocumentationCatalogData);
    assert(header.cms.nodicsDocumentationComponentData);
    assert(header.cms.nodicsDocumentationPageData);
    assert(header.cms.nodicsDocumentationRouteData);
    Object.values(header.cms).forEach(definition => {
        assert.strictEqual(definition.options.operation, 'saveAll');
        assert.strictEqual(definition.query.code, '$code');
    });
});

