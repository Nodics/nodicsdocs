'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
    hash,
    markdownReferences,
    parseMarkdown,
    slug,
    stableCode,
    titleFromPath,
    walkFiles,
    writeJson
} = require('./lib/content-utils');

function argument(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : fallback;
}

const repositoryRoot = path.resolve(__dirname, '..');
const nodicsRoot = path.resolve(argument('nodics-root', path.join(repositoryRoot, '..', 'nodics')));
const articleRoot = path.join(repositoryRoot, 'source', 'articles');
const assetRoot = path.join(repositoryRoot, 'assets', 'images');

if (!fs.existsSync(path.join(nodicsRoot, 'gDocs'))) {
    throw new Error(`Nodics gDocs not found at ${nodicsRoot}`);
}

const gDocsFiles = walkFiles(
    path.join(nodicsRoot, 'gDocs'),
    filePath => path.extname(filePath).toLowerCase() === '.md'
);
const moduleReadmes = walkFiles(nodicsRoot, filePath => {
    if (path.basename(filePath).toLowerCase() !== 'readme.md') return false;
    const directory = path.dirname(filePath);
    return fs.existsSync(path.join(directory, 'package.json')) && !directory.endsWith(`${path.sep}gDocs`);
});
const moduleDocuments = walkFiles(nodicsRoot, filePath => {
    if (path.extname(filePath).toLowerCase() !== '.md') return false;
    if (!filePath.split(path.sep).includes('docs')) return false;
    if (filePath.startsWith(path.join(nodicsRoot, 'docs'))) return false;
    let directory = path.dirname(filePath);
    while (directory.startsWith(nodicsRoot) && directory !== nodicsRoot) {
        if (fs.existsSync(path.join(directory, 'package.json'))) return true;
        directory = path.dirname(directory);
    }
    return false;
});
const sources = [
    ...gDocsFiles.map(filePath => ({ filePath, sourceType: 'gdocs' })),
    ...moduleReadmes.map(filePath => ({ filePath, sourceType: 'module-readme' })),
    ...moduleDocuments.map(filePath => ({ filePath, sourceType: 'module-doc' }))
].sort((left, right) => left.filePath.localeCompare(right.filePath));

fs.rmSync(articleRoot, { recursive: true, force: true });
fs.mkdirSync(articleRoot, { recursive: true });
fs.mkdirSync(assetRoot, { recursive: true });

const routeBySource = new Map();
sources.forEach(source => {
    const relative = path.relative(nodicsRoot, source.filePath).replaceAll(path.sep, '/');
    const route = source.sourceType === 'gdocs'
        ? `/docs/${relative.replace(/^gDocs\//, '').replace(/README\.md$/i, '').replace(/\.md$/i, '')
            .split('/').filter(Boolean).map(slug).join('/')}`.replace(/\/$/, '')
        : `/docs/modules/${relative.replace(/\/README\.md$/i, '').replace(/\.md$/i, '')
            .split('/').map(slug).join('/')}`;
    routeBySource.set(path.resolve(source.filePath), route || '/docs');
});

const articles = sources.map(source => {
    const markdown = fs.readFileSync(source.filePath, 'utf8');
    const relative = path.relative(nodicsRoot, source.filePath).replaceAll(path.sep, '/');
    const normalizedMarkdown = markdown.replace(
        /(?<!!)\[([^\]]+)\]\(([^)\s]+)(\s+["'][^"']+["'])?\)/g,
        (match, label, target, title) => {
            if (/^(https?:|mailto:|#|\/)/i.test(target)) return match;
            const [targetFile, anchor] = target.split('#');
            const resolved = path.resolve(
                path.dirname(source.filePath),
                targetFile || path.basename(source.filePath)
            );
            const route = routeBySource.get(resolved);
            return route
                ? `[${label}](${route}${anchor ? `#${anchor}` : ''}${title || ''})`
                : match;
        }
    );
    const parsed = parseMarkdown(normalizedMarkdown);
    const references = markdownReferences(markdown);
    const firstHeading = parsed.headings.find(item => item.level === 1);
    const code = stableCode('docsArticle', relative);
    const media = references.images.map(reference => {
        if (/^(https?:)?\/\//i.test(reference.target)) {
            return { ...reference, kind: 'external', assetCode: stableCode('docsMedia', reference.target) };
        }
        const sourceAsset = path.resolve(path.dirname(source.filePath), reference.target.split('#')[0]);
        if (!sourceAsset.startsWith(nodicsRoot) || !fs.existsSync(sourceAsset)) {
            return { ...reference, kind: 'missing', sourcePath: reference.target };
        }
        const bytes = fs.readFileSync(sourceAsset);
        const extension = path.extname(sourceAsset).toLowerCase();
        const assetHash = hash(bytes);
        const targetName = `${assetHash.slice(0, 16)}${extension}`;
        const targetPath = path.join(assetRoot, targetName);
        if (!fs.existsSync(targetPath)) fs.copyFileSync(sourceAsset, targetPath);
        return {
            ...reference,
            kind: 'local',
            assetCode: stableCode('docsMedia', assetHash),
            assetPath: `assets/images/${targetName}`,
            contentHash: assetHash
        };
    });
    const mediaByTarget = new Map(media.map(item => [item.target, item]));
    const blocks = parsed.blocks.map(block =>
        block.kind === 'image' ? { ...block, media: mediaByTarget.get(block.target) } : block
    );
    const links = references.links.map(reference => {
        if (/^(https?:|mailto:|#)/i.test(reference.target)) return { ...reference, kind: 'external' };
        const [targetFile, anchor] = reference.target.split('#');
        const resolved = path.resolve(path.dirname(source.filePath), targetFile || path.basename(source.filePath));
        if (routeBySource.has(resolved)) return {
            ...reference,
            kind: 'internal',
            route: routeBySource.get(resolved),
            anchor: anchor || ''
        };
        return {
            ...reference,
            kind: fs.existsSync(resolved) ? 'repository-reference' : 'missing',
            sourcePath: path.relative(nodicsRoot, resolved).replaceAll(path.sep, '/'),
            anchor: anchor || ''
        };
    });
    return {
        code,
        title: firstHeading?.text || titleFromPath(source.filePath),
        route: routeBySource.get(path.resolve(source.filePath)),
        category: source.sourceType === 'gdocs'
            ? relative.replace(/^gDocs\//, '').split('/')[0].replace(/\.md$/i, '')
            : 'modules',
        audience: ['business', 'developer', 'operator'],
        source: {
            repository: 'nodics',
            path: relative,
            type: source.sourceType,
            contentHash: hash(markdown)
        },
        headings: parsed.headings,
        blocks,
        links,
        media,
        unsupported: parsed.unsupported
    };
});

articles.forEach(article => writeJson(path.join(articleRoot, `${article.code}.json`), article));
writeJson(path.join(repositoryRoot, 'manifest', 'documentation-manifest.json'), {
    contractVersion: 1,
    generatedFrom: 'nodics',
    articleCount: articles.length,
    mediaCount: new Set(articles.flatMap(article => article.media.map(item => item.assetCode).filter(Boolean))).size,
    articles: articles.map(article => ({
        code: article.code,
        title: article.title,
        route: article.route,
        category: article.category,
        source: article.source
    }))
});
writeJson(path.join(repositoryRoot, 'manifest', 'migration-report.json'), {
    gDocsPages: gDocsFiles.length,
    moduleReadmes: moduleReadmes.length,
    moduleDocuments: moduleDocuments.length,
    articles: articles.length,
    unsupportedArticles: articles.filter(article => article.unsupported.length > 0).map(article => article.code),
    missingMedia: articles.flatMap(article =>
        article.media.filter(item => item.kind === 'missing').map(item => ({
            article: article.code,
            sourcePath: item.sourcePath
        }))
    ),
    unresolvedLinks: articles.flatMap(article =>
        article.links.filter(item => item.kind === 'missing').map(item => ({
            article: article.code,
            target: item.sourcePath
        }))
    )
});

console.log(
    `Migrated ${articles.length} documentation sources ` +
    `(${gDocsFiles.length} gDocs, ${moduleReadmes.length} module READMEs, ${moduleDocuments.length} module docs)`
);
