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

    assert.match(manifest.releaseChecksum, /^[a-f0-9]{64}$/);
    assert.strictEqual(components.length, manifest.articles + 1);
    assert.strictEqual(pages.length, manifest.articles);
    assert.strictEqual(routes.length, manifest.routes);
    pages.forEach(page => {
        assert.deepStrictEqual(page.cmsSite, manifest.sites);
        assert.strictEqual(page.cmsComponents.length, 2);
        assert(page.cmsComponents.some(relation =>
            relation.target === 'nodicsDocumentationNavigation' &&
            relation.slot === 'navigation'
        ));
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

test('generated article links use canonical documentation routes', () => {
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const article = components.find(record =>
        record.properties?.route === '/docs/commerce/how-to-reserve-stock'
    );
    assert(article, 'Expected the stock reservation documentation component');

    const continueBlock = article.properties.blocks.find(block =>
        block.kind === 'unordered-list' &&
        block.items.some(item => item.includes('How Stock Availability Works'))
    );
    assert(continueBlock, 'Expected the Continue links');
    assert.deepStrictEqual(continueBlock.items, [
        '[How Stock Availability Works](/docs/commerce/how-stock-availability-works)',
        '[How Stock Movements Work](/docs/commerce/how-stock-movements-work)',
        '[How To Create Scheduled Jobs](/docs/jobs/how-to-create-scheduled-jobs)',
        '[Nodics Documentation](/docs)'
    ]);
    assert(continueBlock.items.every(item => !item.includes('.md')));
});

test('generated navigation and adjacent article links form a complete route graph', () => {
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const navigation = components.find(record => record.code === 'nodicsDocumentationNavigation');
    assert(navigation, 'Expected the shared documentation navigation component');

    const articleComponents = components.filter(record =>
        record.renderer === 'documentation.component.article'
    );
    const routes = articleComponents.map(record => record.properties.route);
    const routeSet = new Set(routes);
    assert.strictEqual(routeSet.size, articleComponents.length);
    assert.deepStrictEqual(
        navigation.properties.items.map(item => item.route),
        routes
    );

    articleComponents.forEach((record, index) => {
        const previous = record.properties.previous;
        const next = record.properties.next;
        assert.strictEqual(previous?.route, index > 0 ? routes[index - 1] : undefined);
        assert.strictEqual(next?.route, index < routes.length - 1 ? routes[index + 1] : undefined);
        if (previous) assert(routeSet.has(previous.route));
        if (next) assert(routeSet.has(next.route));
    });
});
