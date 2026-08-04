'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
    hash,
    markdownReferences,
    parseMarkdown,
    slug,
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

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readOptionalJson(relativePath, fallback) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) return fallback;
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function csvArgument(name, fallback) {
    const value = argument(name, undefined);
    const source = value === undefined ? fallback : value;
    if (!source) return [];
    return source.split(',').map(entry => entry.trim()).filter(Boolean);
}

const contentPack = readOptionalJson('manifest/docs-content-pack.json', {});
const sites = csvArgument('sites', (contentPack.sites || []).join(','));
const accessMode = argument('access', contentPack.accessMode || 'AUTHENTICATED').toUpperCase();

function uniqueHeadingAnchor(heading, usedAnchors) {
    const base = slug(heading);
    let candidate = base;
    let suffix = 2;
    while (usedAnchors.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    usedAnchors.add(candidate);
    return candidate;
}

function nestedStrings(value) {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(nestedStrings);
    if (value && typeof value === 'object') {
        return Object.values(value).flatMap(nestedStrings);
    }
    return [];
}

function pageContent(page) {
    const blocks = [];
    const headings = [];
    const links = [];
    const usedAnchors = new Set();
    page.sections.forEach(section => {
        const anchor = uniqueHeadingAnchor(section.heading, usedAnchors);
        headings.push({ level: 2, text: section.heading, anchor });
        blocks.push({ kind: 'heading', level: 2, text: section.heading, anchor });
        (section.paragraphs || []).forEach(text => {
            structuredParagraphBlocks(text).forEach(block => blocks.push(block));
        });
        if (section.items?.length > 0) {
            blocks.push({ kind: 'unordered-list', items: section.items });
        }
        if (section.links?.length > 0) {
            blocks.push({
                kind: 'unordered-list',
                items: section.links.map(link => `[${link.label}](${link.target})`)
            });
            section.links.forEach(link => links.push({
                kind: 'internal',
                label: link.label,
                route: link.target
            }));
        }
    });
    blocks.forEach(block => {
        nestedStrings(block).flatMap(value => markdownReferences(value).links)
            .filter(link => link.target.startsWith('/docs/'))
            .forEach(link => {
                if (!links.some(existing =>
                    existing.label === link.label && existing.route === link.target
                )) {
                    links.push({ kind: 'internal', label: link.label, route: link.target });
                }
            });
    });
    return { blocks, headings, links };
}

function structuredParagraphBlocks(text) {
    const trimmed = text.trim();
    const isCode = trimmed.startsWith('```');
    const isTable = /^\|.*\n\|\s*:?-+/m.test(trimmed);
    const isImage = /^!\[[^\]]*\]\([^)]+\)$/.test(trimmed);
    if (!isCode && !isTable && !isImage) return [{ kind: 'paragraph', text }];

    const parsed = parseMarkdown(text);
    if (parsed.unsupported.length > 0) {
        throw new Error(`Unsupported structured documentation content: ${parsed.unsupported.join(', ')}`);
    }
    return parsed.blocks.map(block => {
        if (block.kind !== 'image') return block;
        const media = resolveMedia(block.target);
        return {
            kind: 'image',
            alt: block.alt,
            title: block.title || '',
            source: media.source,
            mimeType: media.mimeType,
            contentHash: media.contentHash
        };
    });
}

const mediaByTarget = (() => {
    const result = new Map();
    walkFiles(path.join(root, 'source', 'articles'), filePath => filePath.endsWith('.json'))
        .forEach(filePath => {
            const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            (article.media || []).filter(media => media.kind === 'local').forEach(media => {
                result.set(media.target, media);
            });
        });
    return result;
})();

function resolveMedia(target) {
    const media = mediaByTarget.get(target);
    if (!media) throw new Error(`Documentation image has no reviewed media mapping: ${target}`);
    const assetPath = path.join(root, media.assetPath);
    if (!fs.existsSync(assetPath)) {
        throw new Error(`Documentation image asset is missing: ${media.assetPath}`);
    }
    const extension = path.extname(assetPath).toLowerCase();
    const mimeType = extension === '.png' ? 'image/png' :
        extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : undefined;
    if (!mimeType) throw new Error(`Unsupported documentation image type: ${extension}`);
    const bytes = fs.readFileSync(assetPath);
    const contentHash = hash(bytes);
    if (contentHash !== media.contentHash) {
        throw new Error(`Documentation image checksum mismatch: ${media.assetPath}`);
    }
    return {
        source: `data:${mimeType};base64,${bytes.toString('base64')}`,
        mimeType,
        contentHash
    };
}

function orderedPages(pages, taxonomy) {
    const pageByCode = new Map(pages.map(page => [page.code, page]));
    const children = new Map();
    pages.forEach(page => {
        if (!children.has(page.parent)) children.set(page.parent, []);
        children.get(page.parent).push(page);
    });
    children.forEach(items => items.sort((left, right) =>
        left.order - right.order || left.code.localeCompare(right.code)
    ));
    const ordered = [];
    taxonomy.sections.slice().sort((left, right) => left.order - right.order)
        .forEach(section => {
            const visit = page => {
                ordered.push(page);
                (children.get(`page:${page.code}`) || []).forEach(visit);
            };
            (children.get(`section:${section.code}`) || []).forEach(visit);
        });
    if (ordered.length !== pages.length || ordered.some(page => !pageByCode.has(page.code))) {
        throw new Error('Canonical navigation graph is incomplete');
    }
    return ordered;
}

function retiredRecords(retiredPages, sites, accessMode, pageType, componentType, template) {
    const components = [];
    const pages = [];
    const routes = [];
    retiredPages.forEach(retired => {
        const componentCode = stableCode('docsComponent', retired.code);
        const pageCode = stableCode('docsPage', retired.code);
        components.push({
            code: componentCode,
            typeCode: componentType,
            renderer: 'documentation.component.article',
            accessMode,
            properties: {
                title: retired.title,
                route: retired.route,
                retired: true
            },
            active: false
        });
        pages.push({
            code: pageCode,
            name: retired.title,
            cmsSite: sites,
            typeCode: pageType,
            template,
            renderer: 'documentation.page.article',
            cmsComponents: [],
            active: false
        });
        sites.forEach(site => routes.push({
            code: stableCode('docsRoute', `${site}:${retired.route}`),
            site,
            path: retired.route,
            locale: 'en',
            channel: 'web',
            page: pageCode,
            routeType: 'PAGE',
            deliveryState: 'ONLINE',
            accessMode,
            active: false
        }));
    });
    return { components, pages, routes };
}

function main() {
    if (sites.length === 0) {
        throw new Error('At least one target Site is required: --sites axisCmsSite');
    }
    if (!['PUBLIC', 'AUTHENTICATED'].includes(accessMode)) {
        throw new Error('--access must be PUBLIC or AUTHENTICATED');
    }
    const compatibility = readJson('compatibility.json');
    const packageMetadata = readJson('package.json');
    const taxonomy = readJson('source/navigation-taxonomy.json');
    const registry = readJson('source/canonical-pages.json');
    const retired = readJson('source/retired-pages.json');
    const canonicalFiles = walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    );
    const canonicalPages = canonicalFiles.map(filePath => {
        const page = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { ...page, sourceFile: path.relative(root, filePath).replaceAll(path.sep, '/') };
    });
    if (canonicalPages.length === 0) throw new Error('No canonical source pages found');
    const canonicalCodes = new Set(canonicalPages.map(page => page.code));
    const registryCodes = new Set(registry.pages.map(page => page.code));
    if (
        canonicalCodes.size !== canonicalPages.length ||
        registryCodes.size !== registry.pages.length ||
        [...canonicalCodes].some(code => !registryCodes.has(code)) ||
        [...registryCodes].some(code => !canonicalCodes.has(code))
    ) {
        throw new Error('Canonical source pages and registry must match exactly');
    }
    if (retired.contractVersion !== 1 || !Array.isArray(retired.pages)) {
        throw new Error('Unsupported retired-page contract');
    }
    const retiredCodes = new Set();
    const retiredRoutes = new Set();
    retired.pages.forEach(page => {
        if (!page.code || !page.title || !page.route?.startsWith('/docs/')) {
            throw new Error('Retired pages require code, title, and canonical route');
        }
        if (
            retiredCodes.has(page.code) || retiredRoutes.has(page.route) ||
            canonicalCodes.has(page.code) || canonicalPages.some(item => item.route === page.route)
        ) {
            throw new Error(`Invalid or duplicate retired page: ${page.code}`);
        }
        retiredCodes.add(page.code);
        retiredRoutes.add(page.route);
    });

    const sectionByCode = new Map(taxonomy.sections.map(section => [section.code, section]));
    const capabilityByCode = new Map(taxonomy.capabilities.map(capability => [
        capability.code,
        capability
    ]));
    const ordered = orderedPages(canonicalPages, taxonomy);
    const output = path.join(root, 'data', 'core', 'data', 'documentation');
    const pageType = 'nodicsDocumentationArticlePageType';
    const componentType = 'nodicsDocumentationArticleComponentType';
    const navigationComponentType = 'nodicsDocumentationNavigationComponentType';
    const template = 'nodicsDocumentationArticleTemplate';
    const navigationSlot = 'nodicsDocumentationNavigationSlot';
    const articleSlot = 'nodicsDocumentationArticleSlot';
    const navigationComponent = 'nodicsDocumentationNavigation';

    const canonicalRecords = ordered.map(page => {
        const content = pageContent(page);
        const section = sectionByCode.get(page.section);
        const capability = page.capability ? capabilityByCode.get(page.capability) : null;
        const aliases = capability?.aliases || [];
        const sourceHash = hash(JSON.stringify({
            ...page,
            sourceFile: undefined
        }));
        const searchText = [
            page.title,
            page.summary,
            page.readerIntent,
            page.priorKnowledge,
            page.owner,
            section?.title,
            capability?.title,
            ...aliases,
            ...page.sections.flatMap(item => [
                item.heading,
                ...(item.paragraphs || []),
                ...(item.items || []),
                ...(item.links || []).map(link => link.label)
            ])
        ].filter(Boolean).join(' ');
        return {
            page,
            section,
            capability,
            aliases,
            sourceHash,
            searchText,
            ...content
        };
    });
    const navigationItems = canonicalRecords.map(record => ({
        code: record.page.code,
        title: record.page.title,
        route: record.page.route,
        section: record.page.section,
        sectionTitle: record.section.title,
        sectionOrder: record.section.order,
        parent: record.page.parent,
        order: record.page.order,
        family: record.page.family,
        capability: record.page.capability,
        capabilityTitle: record.capability?.title,
        aliases: record.aliases,
        audience: record.page.audiences,
        depth: record.page.depth,
        summary: record.page.summary,
        searchText: record.searchText
    }));

    const catalogRecords = [{
        code: compatibility.catalog,
        name: 'Nodics Documentation Content Catalog',
        active: true
    }];
    const typeRecords = [
        { code: pageType, kind: 'PAGE', contractVersion: 2, active: true },
        {
            code: componentType,
            kind: 'COMPONENT',
            contractVersion: 2,
            propertySchema: {
                code: 'string',
                title: 'string',
                route: 'string',
                section: 'string',
                sectionTitle: 'string',
                family: 'string',
                capability: 'string',
                capabilityTitle: 'string',
                aliases: 'array',
                audience: 'array',
                depth: 'string',
                summary: 'string',
                readerIntent: 'string',
                priorKnowledge: 'string',
                owner: 'string',
                status: 'string',
                lastVerified: 'string',
                headings: 'array',
                blocks: 'array',
                links: 'array',
                source: 'object',
                sourceHash: 'string',
                searchText: 'string',
                packVersion: 'string',
                previous: 'object',
                next: 'object'
            },
            active: true
        },
        {
            code: navigationComponentType,
            kind: 'COMPONENT',
            contractVersion: 2,
            propertySchema: {
                title: 'string',
                searchLabel: 'string',
                searchPlaceholder: 'string',
                emptyMessage: 'string',
                sections: 'array',
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
            contractVersion: 2,
            channels: ['web', 'mobile-webview'],
            deprecated: false,
            active: true
        },
        {
            code: componentType,
            renderer: 'documentation.component.article',
            contractVersion: 2,
            channels: ['web', 'mobile-webview'],
            deprecated: false,
            active: true
        },
        {
            code: navigationComponentType,
            renderer: 'documentation.component.navigation',
            contractVersion: 2,
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
        contractVersion: 2,
        slots: [navigationSlot, articleSlot],
        active: true
    }];
    const retiredOutput = retiredRecords(
        retired.pages,
        sites,
        accessMode,
        pageType,
        componentType,
        template
    );
    const componentRecords = [{
        code: navigationComponent,
        typeCode: navigationComponentType,
        renderer: 'documentation.component.navigation',
        accessMode,
        properties: {
            title: 'Documentation',
            searchLabel: 'Search documentation',
            searchPlaceholder: 'Search pages, capabilities, business topics, and technical terms',
            emptyMessage: 'No documentation matches your search.',
            sections: taxonomy.sections,
            items: navigationItems,
            packVersion: packageMetadata.version
        },
        active: true
    }, ...canonicalRecords.map((record, index) => ({
        code: stableCode('docsComponent', record.page.code),
        typeCode: componentType,
        renderer: 'documentation.component.article',
        accessMode,
        properties: {
            code: record.page.code,
            title: record.page.title,
            route: record.page.route,
            section: record.page.section,
            sectionTitle: record.section.title,
            family: record.page.family,
            capability: record.page.capability,
            capabilityTitle: record.capability?.title,
            aliases: record.aliases,
            audience: record.page.audiences,
            depth: record.page.depth,
            summary: record.page.summary,
            readerIntent: record.page.readerIntent,
            priorKnowledge: record.page.priorKnowledge,
            owner: record.page.owner,
            status: record.page.status,
            lastVerified: record.page.lastVerified,
            headings: record.headings,
            blocks: record.blocks,
            links: record.links,
            source: {
                authority: 'nodicsdocs/source/pages',
                file: record.page.sourceFile,
                evidence: record.page.evidence || [],
                supportingEvidence: record.page.supportingEvidence || []
            },
            sourceHash: record.sourceHash,
            searchText: record.searchText,
            packVersion: packageMetadata.version,
            previous: index > 0 ? navigationItems[index - 1] : undefined,
            next: index < navigationItems.length - 1 ? navigationItems[index + 1] : undefined
        },
        active: true
    })), ...retiredOutput.components];
    const pageRecords = canonicalRecords.map(record => ({
        code: stableCode('docsPage', record.page.code),
        name: record.page.title,
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
                target: stableCode('docsComponent', record.page.code),
                slot: 'article',
                index: 10,
                active: true
            }
        ],
        active: true
    })).concat(retiredOutput.pages);
    const articleRouteRecords = canonicalRecords.flatMap(record => sites.map(site => ({
        code: stableCode('docsRoute', `${site}:${record.page.route}`),
        site,
        path: record.page.route,
        locale: 'en',
        channel: 'web',
        page: stableCode('docsPage', record.page.code),
        routeType: 'PAGE',
        deliveryState: 'ONLINE',
        accessMode,
        active: true
    })));
    const documentationHome = canonicalRecords[0];
    const landingRouteRecords = sites.map(site => ({
        code: stableCode('docsRoute', `${site}:/docs`),
        site,
        path: '/docs',
        locale: 'en',
        channel: 'web',
        page: stableCode('docsPage', documentationHome.page.code),
        routeType: 'PAGE',
        deliveryState: 'ONLINE',
        accessMode,
        active: true
    }));
    const routeRecords = articleRouteRecords
        .concat(landingRouteRecords)
        .concat(retiredOutput.routes);

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
    walkFiles(path.join(root, 'data', 'core'), filePath => filePath.endsWith('.js'))
        .forEach(filePath => {
            generatedHashes[path.relative(root, filePath).replaceAll(path.sep, '/')] =
                hash(fs.readFileSync(filePath));
        });
    const releaseChecksum = hash(
        Object.keys(generatedHashes).sort()
            .map(fileName => `${fileName}:${generatedHashes[fileName]}`)
            .join('|')
    );
    const legacySnapshotArticles = walkFiles(
        path.join(root, 'source', 'articles'),
        filePath => filePath.endsWith('.json')
    ).length;
    writeJson(path.join(root, 'manifest', 'docs-content-pack.json'), {
        ...contentPack,
        pack: compatibility.pack,
        version: packageMetadata.version,
        contractVersion: compatibility.contentContractVersion,
        sourceMode: 'canonical',
        sourceAuthority: 'source/pages',
        sites,
        accessMode
    });
    writeJson(path.join(root, 'manifest', 'generated-content-pack.json'), {
        pack: compatibility.pack,
        version: packageMetadata.version,
        contractVersion: compatibility.contentContractVersion,
        sourceMode: 'canonical',
        sourceAuthority: 'source/pages',
        sites,
        accessMode,
        articles: canonicalRecords.length,
        retiredPages: retired.pages.length,
        components: componentRecords.length,
        pages: pageRecords.length,
        routes: routeRecords.length,
        legacySnapshotArticles,
        releaseChecksum,
        generatedHashes
    });
    console.log(
        `Built ${canonicalRecords.length} canonical documentation pages, ` +
        `${retired.pages.length} retirement tombstones, and ${routeRecords.length} Site routes`
    );
}

if (require.main === module) main();

module.exports = {
    main,
    nestedStrings,
    orderedPages,
    pageContent,
    retiredRecords
};
