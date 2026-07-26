'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { SUPPORTED_BLOCKS, hash, markdownReferences, walkFiles } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');
const errors = [];

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function records(relativePath) {
    const absolutePath = path.join(root, relativePath);
    delete require.cache[require.resolve(absolutePath)];
    return Object.values(require(absolutePath));
}

function duplicates(values) {
    const seen = new Set();
    return [...new Set(values.filter(value => seen.has(value) || !seen.add(value)))];
}

const compatibility = readJson('compatibility.json');
const registry = readJson('source/canonical-pages.json');
const retired = readJson('source/retired-pages.json');
const sourcePages = walkFiles(
    path.join(root, 'source', 'pages'),
    filePath => filePath.endsWith('.json')
).map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));
const legacyArticleCount = walkFiles(
    path.join(root, 'source', 'articles'),
    filePath => filePath.endsWith('.json')
).length;
const generated = readJson('manifest/generated-content-pack.json');
const components = records('data/core/data/documentation/nodicsDocumentationComponentData.js');
const pages = records('data/core/data/documentation/nodicsDocumentationPageData.js');
const routes = records('data/core/data/documentation/nodicsDocumentationRouteData.js');
const articleComponents = components.filter(record =>
    record.renderer === 'documentation.component.article' && record.active !== false
);
const retiredComponents = components.filter(record =>
    record.renderer === 'documentation.component.article' && record.active === false
);
const sourceByRoute = new Map(sourcePages.map(page => [page.route, page]));
const routeSet = new Set(sourcePages.map(page => page.route));

if (compatibility.pack !== 'nodicsdocs') errors.push('compatibility.pack must be nodicsdocs');
if (compatibility.contentContractVersion !== 1) errors.push('Unsupported content contract version');
if (generated.sourceMode !== 'canonical') errors.push('Generated sourceMode must be canonical');
if (generated.sourceAuthority !== 'source/pages') {
    errors.push('Generated sourceAuthority must be source/pages');
}
if (generated.version !== compatibility.version) errors.push('Generated version does not match compatibility');
if (generated.articles !== sourcePages.length) errors.push('Generated canonical article count mismatch');
if (generated.articles !== registry.pages.length) errors.push('Canonical registry projection mismatch');
if (generated.legacySnapshotArticles !== legacyArticleCount) {
    errors.push('Legacy snapshot count mismatch');
}
if (generated.retiredPages !== retired.pages.length) errors.push('Retired-page count mismatch');
if (!Array.isArray(generated.sites) || generated.sites.length === 0) {
    errors.push('Generated pack has no target Sites');
}

duplicates(sourcePages.map(page => page.code))
    .forEach(code => errors.push(`Duplicate canonical page code: ${code}`));
duplicates(sourcePages.map(page => page.route))
    .forEach(route => errors.push(`Duplicate canonical page route: ${route}`));
duplicates(components.map(record => record.code))
    .forEach(code => errors.push(`Duplicate component code: ${code}`));
duplicates(pages.map(record => record.code))
    .forEach(code => errors.push(`Duplicate page code: ${code}`));
duplicates(routes.map(record => record.code))
    .forEach(code => errors.push(`Duplicate route code: ${code}`));

articleComponents.forEach(component => {
    const properties = component.properties || {};
    const source = sourceByRoute.get(properties.route);
    if (!source) {
        errors.push(`Published noncanonical article route: ${properties.route || component.code}`);
        return;
    }
    if (properties.code !== source.code) errors.push(`Article code mismatch: ${source.code}`);
    if (properties.source?.authority !== 'nodicsdocs/source/pages') {
        errors.push(`Invalid source authority: ${source.code}`);
    }
    if (!/^[a-f0-9]{64}$/.test(properties.sourceHash || '')) {
        errors.push(`Invalid source hash: ${source.code}`);
    }
    const anchors = (properties.headings || []).map(heading => heading.anchor);
    duplicates(anchors).forEach(anchor =>
        errors.push(`Duplicate heading anchor #${anchor} in ${source.code}`)
    );
    (properties.blocks || []).forEach(block => {
        if (!SUPPORTED_BLOCKS.has(block.kind)) {
            errors.push(`Unsupported block ${block.kind} in ${source.code}`);
        }
        const serialized = JSON.stringify(block);
        if (/<\s*(script|iframe|object|embed|style)\b/i.test(serialized) ||
            /\son[a-z]+\s*=/i.test(serialized)) {
            errors.push(`Unsafe content in ${source.code}`);
        }
        markdownReferences(serialized).links
            .filter(link => link.target.startsWith('/docs/'))
            .forEach(link => {
                const [targetRoute] = link.target.split('#');
                if (!routeSet.has(targetRoute)) {
                    errors.push(`Broken documentation route ${targetRoute} in ${source.code}`);
                }
            });
    });
    (properties.links || []).filter(link => link.kind === 'internal').forEach(link => {
        if (!routeSet.has(link.route)) {
            errors.push(`Broken internal link ${link.route} in ${source.code}`);
        }
    });
});

if (articleComponents.length !== sourcePages.length) {
    errors.push('Active article component count mismatch');
}
if (retiredComponents.length !== retired.pages.length) {
    errors.push('Retired article tombstone count mismatch');
}
retired.pages.forEach(retiredPage => {
    const matchingRoutes = routes.filter(route => route.path === retiredPage.route);
    if (matchingRoutes.length !== generated.sites.length ||
        matchingRoutes.some(route => route.active !== false)) {
        errors.push(`Missing inactive route tombstone: ${retiredPage.code}`);
    }
});

Object.entries(generated.generatedHashes || {}).forEach(([relative, expected]) => {
    const filePath = path.join(root, relative);
    if (!fs.existsSync(filePath) || hash(fs.readFileSync(filePath)) !== expected) {
        errors.push(`Generated file drift: ${relative}`);
    }
});

if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log(
        `Validated ${sourcePages.length} canonical pages, ` +
        `${retired.pages.length} retirement tombstones, and isolated ` +
        `${legacyArticleCount} legacy snapshot articles`
    );
}
