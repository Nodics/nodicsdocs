'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { walkFiles } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');
const errors = [];

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function duplicates(values) {
    const seen = new Set();
    return [...new Set(values.filter(value => seen.has(value) || !seen.add(value)))];
}

const taxonomy = readJson('source/navigation-taxonomy.json');
const registry = readJson('source/canonical-pages.json');
const migration = readJson('manifest/migration-register.json');
const pageFiles = walkFiles(
    path.join(root, 'source', 'pages'),
    filePath => filePath.endsWith('.json')
);
const pages = pageFiles.map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));
const registryByCode = new Map(registry.pages.map(page => [page.code, page]));
const migrationById = new Map(migration.entries.map(entry => [entry.evidenceId, entry]));
const allowedAudiences = new Set([
    'evaluator', 'business-user', 'administrator', 'developer', 'architect',
    'security-reviewer', 'operator', 'framework-maintainer', 'ai-tool'
]);
const allowedDepths = new Set(['overview', 'guided', 'implementation', 'reference']);

duplicates(pages.map(page => page.code)).forEach(code => errors.push(`Duplicate canonical page code: ${code}`));
duplicates(pages.map(page => page.route)).forEach(route => errors.push(`Duplicate canonical route: ${route}`));
const pageByRoute = new Map(pages.map(page => [page.route, page]));
const siblingOrder = new Set();

pages.forEach(page => {
    const registered = registryByCode.get(page.code);
    if (!registered) {
        errors.push(`Unregistered canonical page: ${page.code}`);
        return;
    }
    if (page.section !== registered.section) errors.push(`Section mismatch: ${page.code}`);
    if (page.family !== registered.family) errors.push(`Page-family mismatch: ${page.code}`);
    if (!page.route?.startsWith('/docs/')) errors.push(`Invalid canonical route: ${page.code}`);
    if (page.parent !== `section:${page.section}`) errors.push(`Invalid parent: ${page.code}`);
    if (!Number.isInteger(page.order) || page.order <= 0) errors.push(`Invalid order: ${page.code}`);
    const siblingKey = `${page.parent}:${page.order}`;
    if (siblingOrder.has(siblingKey)) errors.push(`Duplicate sibling order: ${siblingKey}`);
    siblingOrder.add(siblingKey);
    if (!page.summary || !page.readerIntent || !page.owner) errors.push(`Incomplete page purpose: ${page.code}`);
    if (!allowedDepths.has(page.depth)) errors.push(`Invalid depth: ${page.code}`);
    if (!Array.isArray(page.audiences) || page.audiences.length === 0) {
        errors.push(`Missing audiences: ${page.code}`);
    } else {
        page.audiences.filter(audience => !allowedAudiences.has(audience))
            .forEach(audience => errors.push(`Invalid audience ${audience}: ${page.code}`));
    }
    if (page.status !== 'implemented') errors.push(`Non-implemented public page: ${page.code}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(page.lastVerified)) errors.push(`Invalid verification date: ${page.code}`);
    if (!Array.isArray(page.evidence) || page.evidence.length === 0) {
        errors.push(`Missing evidence: ${page.code}`);
    } else {
        page.evidence.forEach(evidenceId => {
            const evidence = migrationById.get(evidenceId);
            if (!evidence) errors.push(`Unknown evidence ${evidenceId}: ${page.code}`);
            else if (evidence.destinationCode !== page.code) {
                errors.push(`Evidence destination mismatch ${evidenceId}: ${page.code}`);
            }
        });
    }
    if (!Array.isArray(page.sections) || page.sections.length === 0) {
        errors.push(`Missing content sections: ${page.code}`);
    } else {
        page.sections.flatMap(section => section.links || []).forEach(link => {
            if (!link.label || !link.target?.startsWith('/docs/')) {
                errors.push(`Invalid canonical link: ${page.code}`);
            } else if (!pageByRoute.has(link.target)) {
                errors.push(`Unknown canonical link ${link.target}: ${page.code}`);
            }
        });
    }
});

if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Validated ${pages.length} canonical documentation pages`);
}
