'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function records(relativePath) {
    return Object.values(require(path.join(root, relativePath)));
}

function canonicalPageCount() {
    const { walkFiles } = require('../scripts/lib/content-utils');
    return walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    ).length;
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
    assert.strictEqual(components.length, manifest.articles + manifest.retiredPages + 1);
    assert.strictEqual(pages.length, manifest.articles + manifest.retiredPages);
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

test('generated articles come from canonical source and keep their internal links', () => {
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const article = components.find(record =>
        record.properties?.route === '/docs/discover/what-is-nodics'
    );
    assert(article, 'Expected the Nodics overview documentation component');

    const pathBlock = article.properties.blocks.find(block =>
        block.kind === 'unordered-list' &&
        block.items.some(item => item.includes('Evaluate Nodics for an organization'))
    );
    assert(pathBlock, 'Expected canonical next-path links');
    assert(pathBlock.items.every(item => item.includes('](/docs/')));
    assert.strictEqual(article.properties.source.authority, 'nodicsdocs/source/pages');
    const labels = article.properties.links.map(link => link.label);
    [
        'Evaluate Nodics for an organization',
        'Understand why teams choose Nodics',
        'Review security and trust',
        'Set up Nodics locally',
        'Learn how the framework is organized',
        'Explore Nodics as Data as a Service'
    ].forEach(label => assert(labels.includes(label), `Expected canonical link: ${label}`));
    assert(
        article.properties.links.length > 6,
        'Expected preserved detailed guides to retain their canonicalized internal links'
    );
});

test('generated articles preserve every reviewed image as a safe structured block', () => {
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const images = components.flatMap(record => record.properties?.blocks || [])
        .filter(block => block.kind === 'image');

    assert.strictEqual(images.length, 21);
    images.forEach(image => {
        assert(image.alt);
        assert.match(image.source, /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/);
        assert(['image/jpeg', 'image/png'].includes(image.mimeType));
        assert.match(image.contentHash, /^[a-f0-9]{64}$/);
    });
});

test('generated articles convert fenced code and Markdown tables into structured blocks', () => {
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const blocks = components.flatMap(record => record.properties?.blocks || []);
    const overview = components.find(record =>
        record.properties?.route === '/docs/discover/what-is-nodics'
    );

    assert(blocks.some(block => block.kind === 'code' && block.text === 'npm ci'));
    assert(blocks.some(block => block.kind === 'table'));
    assert(
        overview.properties.blocks.some(block =>
            block.kind === 'table' &&
            block.headers[0] === 'Need' &&
            block.headers[1] === 'Read'
        )
    );
    blocks.filter(block => block.kind === 'paragraph').forEach(block => {
        assert.equal(block.text.includes('```'), false);
        assert.equal(/^\|.*\n\|\s*:?-+/m.test(block.text), false);
    });
});

test('generated navigation and adjacent article links form a complete route graph', () => {
    const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
    const navigation = components.find(record => record.code === 'nodicsDocumentationNavigation');
    assert(navigation, 'Expected the shared documentation navigation component');

    const articleComponents = components.filter(record =>
        record.renderer === 'documentation.component.article' && record.active !== false
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

test('canonical generation is deterministic and isolates the legacy snapshot', () => {
    const manifest = JSON.parse(
        fs.readFileSync(path.join(root, 'manifest', 'generated-content-pack.json'), 'utf8')
    );
    const migrationManifest = JSON.parse(
        fs.readFileSync(path.join(root, 'manifest', 'documentation-manifest.json'), 'utf8')
    );
    const legacyFiles = fs.readdirSync(path.join(root, 'source', 'articles'));
    assert.strictEqual(manifest.sourceMode, 'canonical');
    assert.strictEqual(manifest.sourceAuthority, 'source/pages');
    assert.strictEqual(manifest.articles, canonicalPageCount());
    assert.strictEqual(manifest.legacySnapshotArticles, migrationManifest.articleCount);
    assert(legacyFiles.length > 0);

    const routes = records('data/core/data/documentation/nodicsDocumentationRouteData.js');
    assert(routes.some(route => route.path === '/docs/discover/what-is-nodics'));
    const documentationHome = routes.find(route => route.path === '/docs');
    const canonicalIntroduction = routes.find(
        route => route.path === '/docs/discover/what-is-nodics'
    );
    assert(documentationHome, 'Expected the stable documentation landing route');
    assert.strictEqual(documentationHome.page, canonicalIntroduction.page);
    assert.strictEqual(documentationHome.accessMode, 'AUTHENTICATED');
    assert(!routes.some(route => route.path === '/docs/commerce/how-to-reserve-stock'));
});

test('retirement contract deactivates records without introducing deletion', () => {
    const { retiredRecords } = require(path.join(root, 'scripts/generate-content-pack.js'));
    const output = retiredRecords(
        [{ code: 'retired.example', title: 'Retired example', route: '/docs/retired/example' }],
        ['axisCmsSite'],
        'AUTHENTICATED',
        'pageType',
        'componentType',
        'template'
    );
    assert.strictEqual(output.components[0].active, false);
    assert.strictEqual(output.pages[0].active, false);
    assert.strictEqual(output.routes[0].active, false);
    assert.strictEqual(output.routes[0].path, '/docs/retired/example');
});
