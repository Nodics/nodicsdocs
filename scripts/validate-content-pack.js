'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { SUPPORTED_BLOCKS, hash, walkFiles } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');
const errors = [];
const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'compatibility.json'), 'utf8'));
const articleFiles = walkFiles(path.join(root, 'source', 'articles'), filePath => filePath.endsWith('.json'));
const articles = articleFiles.map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));

function duplicates(values) {
    const seen = new Set();
    return [...new Set(values.filter(value => seen.has(value) || !seen.add(value)))];
}

if (compatibility.pack !== 'nodicsdocs') errors.push('compatibility.pack must be nodicsdocs');
if (compatibility.contentContractVersion !== 1) errors.push('Unsupported content contract version');
duplicates(articles.map(article => article.code)).forEach(code => errors.push(`Duplicate article code: ${code}`));
duplicates(articles.map(article => article.route)).forEach(route => errors.push(`Duplicate article route: ${route}`));

articles.forEach(article => {
    if (!article.code || !article.title || !article.route?.startsWith('/docs')) {
        errors.push(`Invalid article identity: ${article.code || article.source?.path || 'unknown'}`);
    }
    if (!/^[a-f0-9]{64}$/.test(article.source.contentHash)) errors.push(`Invalid source hash: ${article.code}`);
    article.blocks.forEach(block => {
        if (!SUPPORTED_BLOCKS.has(block.kind)) errors.push(`Unsupported block ${block.kind} in ${article.code}`);
        const serialized = JSON.stringify(block);
        if (/<\s*(script|iframe|object|embed|style)\b/i.test(serialized) || /\son[a-z]+\s*=/i.test(serialized)) {
            errors.push(`Unsafe content in ${article.code}`);
        }
    });
    article.media.filter(item => item.kind === 'local').forEach(item => {
        if (!fs.existsSync(path.join(root, item.assetPath))) errors.push(`Missing asset ${item.assetPath}`);
    });
    article.media.filter(item => item.kind === 'missing').forEach(item => {
        errors.push(`Unresolved media ${item.sourcePath} in ${article.code}`);
    });
    article.links.filter(item => item.kind === 'missing').forEach(item => {
        errors.push(`Unresolved link ${item.sourcePath} in ${article.code}`);
    });
});

const generatedManifestPath = path.join(root, 'manifest', 'generated-content-pack.json');
if (fs.existsSync(generatedManifestPath)) {
    const generated = JSON.parse(fs.readFileSync(generatedManifestPath, 'utf8'));
    if (!Array.isArray(generated.sites) || generated.sites.length === 0) errors.push('Generated pack has no target Sites');
    Object.entries(generated.generatedHashes).forEach(([relative, expected]) => {
        const filePath = path.join(root, relative);
        if (!fs.existsSync(filePath) || hash(fs.readFileSync(filePath)) !== expected) {
            errors.push(`Generated file drift: ${relative}`);
        }
    });
}

if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Validated ${articles.length} documentation articles`);
}
