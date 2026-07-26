'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
    hash,
    stableCode,
    walkFiles,
    writeCommonJsRecords,
    writeJson
} = require('./lib/content-utils');

function argument(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : fallback;
}

const root = path.resolve(__dirname, '..');
const sites = argument('sites', '').split(',').map(value => value.trim()).filter(Boolean);
const accessMode = argument('access', 'PUBLIC').toUpperCase();
if (sites.length === 0) throw new Error('At least one target Site is required: --sites axisCmsSite');
if (!['PUBLIC', 'AUTHENTICATED'].includes(accessMode)) {
    throw new Error('--access must be PUBLIC or AUTHENTICATED');
}

const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'compatibility.json'), 'utf8'));
const articleFiles = walkFiles(
    path.join(root, 'source', 'articles'),
    filePath => path.extname(filePath) === '.json'
);
const articles = articleFiles.map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')))
    .sort((left, right) => left.route.localeCompare(right.route));
if (articles.length === 0) throw new Error('No source articles found; run npm run migrate first');

const output = path.join(root, 'data', 'core', 'data', 'documentation');
const pageType = 'nodicsDocumentationArticlePageType';
const componentType = 'nodicsDocumentationArticleComponentType';
const navigationComponentType = 'nodicsDocumentationNavigationComponentType';
const template = 'nodicsDocumentationArticleTemplate';
const navigationSlot = 'nodicsDocumentationNavigationSlot';
const articleSlot = 'nodicsDocumentationArticleSlot';
const navigationComponent = 'nodicsDocumentationNavigation';

const catalogRecords = [{
    code: compatibility.catalog,
    name: 'Nodics Documentation Content Catalog',
    active: true
}];
const typeRecords = [
    { code: pageType, kind: 'PAGE', contractVersion: 1, active: true },
    {
        code: componentType,
        kind: 'COMPONENT',
        contractVersion: 1,
        propertySchema: {
            title: 'string',
            route: 'string',
            category: 'string',
            audience: 'array',
            headings: 'array',
            blocks: 'array',
            links: 'array',
            media: 'array',
            source: 'object',
            packVersion: 'string'
        },
        active: true
    },
    {
        code: navigationComponentType,
        kind: 'COMPONENT',
        contractVersion: 1,
        propertySchema: {
            title: 'string',
            searchLabel: 'string',
            searchPlaceholder: 'string',
            emptyMessage: 'string',
            items: 'array',
            packVersion: 'string'
        },
        active: true
    }
];
const rendererRecords = [
    {
        code: pageType,
        renderer: 'documentation.page.article',
        contractVersion: 1,
        channels: ['web', 'mobile-webview'],
        deprecated: false,
        active: true
    },
    {
        code: componentType,
        renderer: 'documentation.component.article',
        contractVersion: 1,
        channels: ['web', 'mobile-webview'],
        deprecated: false,
        active: true
    },
    {
        code: navigationComponentType,
        renderer: 'documentation.component.navigation',
        contractVersion: 1,
        channels: ['web', 'mobile-webview'],
        deprecated: false,
        active: true
    }
];
const slotRecords = [
    {
        code: navigationSlot,
        template,
        name: 'navigation',
        minItems: 1,
        maxItems: 1,
        allowedComponentTypes: [navigationComponentType],
        active: true
    },
    {
        code: articleSlot,
        template,
        name: 'article',
        minItems: 1,
        maxItems: 1,
        allowedComponentTypes: [componentType],
        active: true
    }
];
const templateRecords = [{
    code: template,
    name: 'Nodics Documentation Article',
    renderer: 'documentation.template.article',
    contractVersion: 1,
    slots: [navigationSlot, articleSlot],
    active: true
}];
const navigationItems = articles.map(article => ({
    title: article.title,
    route: article.route,
    category: article.category,
    audience: article.audience
}));
const componentRecords = [{
    code: navigationComponent,
    typeCode: navigationComponentType,
    renderer: 'documentation.component.navigation',
    accessMode: 'PUBLIC',
    properties: {
        title: 'Documentation',
        searchLabel: 'Search documentation',
        searchPlaceholder: 'Search pages, categories, and audiences',
        emptyMessage: 'No documentation matches your search.',
        items: navigationItems,
        packVersion: compatibility.version
    },
    active: true
}, ...articles.map((article, index) => ({
    code: stableCode('docsComponent', article.code),
    typeCode: componentType,
    renderer: 'documentation.component.article',
    accessMode: 'PUBLIC',
    properties: {
        title: article.title,
        route: article.route,
        category: article.category,
        audience: article.audience,
        headings: article.headings,
        blocks: article.blocks,
        links: article.links,
        media: article.media,
        source: article.source,
        packVersion: compatibility.version,
        previous: index > 0 ? navigationItems[index - 1] : undefined,
        next: index < navigationItems.length - 1 ? navigationItems[index + 1] : undefined
    },
    active: true
}))];
const pageRecords = articles.map(article => ({
    code: stableCode('docsPage', article.code),
    name: article.title,
    cmsSite: sites,
    typeCode: pageType,
    template,
    renderer: 'documentation.page.article',
    cmsComponents: [
        {
            target: navigationComponent,
            slot: 'navigation',
            index: 5,
            active: true
        },
        {
            target: stableCode('docsComponent', article.code),
            slot: 'article',
            index: 10,
            active: true
        }
    ],
    active: true
}));
const routeRecords = articles.flatMap(article => sites.map(site => ({
    code: stableCode('docsRoute', `${site}:${article.route}`),
    site,
    path: article.route,
    locale: 'en',
    channel: 'web',
    page: stableCode('docsPage', article.code),
    routeType: 'PAGE',
    deliveryState: 'ONLINE',
    accessMode,
    active: true
})));

writeCommonJsRecords(path.join(output, 'nodicsDocumentationCatalogData.js'), catalogRecords, 'Documentation catalog records.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationTypeCodeData.js'), typeRecords, 'Documentation page and component type records.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationRendererData.js'), rendererRecords, 'Documentation renderer mappings.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationSlotData.js'), slotRecords, 'Documentation template slot records.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationTemplateData.js'), templateRecords, 'Documentation template records.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationComponentData.js'), componentRecords, 'Documentation article component records.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationPageData.js'), pageRecords, 'Documentation article page records.');
writeCommonJsRecords(path.join(output, 'nodicsDocumentationRouteData.js'), routeRecords, 'Documentation Site route records.');

const header = {
    catalog: {
        nodicsDocumentationCatalogData: {
            options: {
                enabled: true,
                schemaName: 'catalog',
                operation: 'saveAll',
                dataFilePrefix: 'nodicsDocumentationCatalogData'
            },
            query: { code: '$code' }
        }
    },
    cms: Object.fromEntries([
        ['nodicsDocumentationTypeCodeData', 'cmsTypeCode'],
        ['nodicsDocumentationRendererData', 'cmsTypeCode2Renderer'],
        ['nodicsDocumentationSlotData', 'cmsSlotDefinition'],
        ['nodicsDocumentationTemplateData', 'cmsPageTemplate'],
        ['nodicsDocumentationComponentData', 'cmsComponent'],
        ['nodicsDocumentationPageData', 'cmsPage'],
        ['nodicsDocumentationRouteData', 'cmsPageRoute']
    ].map(([dataFilePrefix, schemaName]) => [
        dataFilePrefix,
        {
            options: { enabled: true, schemaName, operation: 'saveAll', dataFilePrefix },
            query: { code: '$code' }
        }
    ]))
};
fs.mkdirSync(path.join(root, 'data', 'core', 'headers'), { recursive: true });
fs.writeFileSync(
    path.join(root, 'data', 'core', 'headers', 'nodicsDocumentationContentPackHeader.js'),
    `'use strict';\n\n/** @generated Standard Nodics core-import header for nodicsdocs. */\nmodule.exports = ${JSON.stringify(header, null, 4)};\n`
);

const generatedHashes = {};
walkFiles(path.join(root, 'data', 'core'), filePath => filePath.endsWith('.js')).forEach(filePath => {
    generatedHashes[path.relative(root, filePath).replaceAll(path.sep, '/')] = hash(fs.readFileSync(filePath));
});
const releaseChecksum = hash(
    Object.keys(generatedHashes).sort()
        .map(fileName => `${fileName}:${generatedHashes[fileName]}`)
        .join('|')
);
writeJson(path.join(root, 'manifest', 'generated-content-pack.json'), {
    pack: compatibility.pack,
    version: compatibility.version,
    contractVersion: compatibility.contentContractVersion,
    sites,
    accessMode,
    articles: articles.length,
    components: componentRecords.length,
    pages: pageRecords.length,
    routes: routeRecords.length,
    releaseChecksum,
    generatedHashes
});
console.log(`Built ${articles.length} documentation pages and ${routeRecords.length} Site routes`);
