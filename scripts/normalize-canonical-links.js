'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { walkFiles, writeJson } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function main() {
    const migration = readJson('manifest/migration-register.json');
    const routeByCode = new Map(walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    ).map(filePath => {
        const page = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return [page.code, page.route];
    }));
    const canonicalRoutes = new Set(routeByCode.values());
    const replacementByLegacyRoute = new Map();

    migration.entries.forEach(entry => {
        if (entry.currentRoute && entry.destinationCode && routeByCode.has(entry.destinationCode)) {
            const destination = routeByCode.get(entry.destinationCode);
            replacementByLegacyRoute.set(entry.currentRoute, destination);
            if (entry.sourcePath?.startsWith('gDocs/')) {
                const legacyPath = entry.sourcePath
                    .slice('gDocs/'.length)
                    .replace(/\/README\.md$/i, '')
                    .replace(/\.md$/i, '');
                replacementByLegacyRoute.set(
                    legacyPath ? `/docs/${legacyPath}` : '/docs',
                    destination
                );
            }
        }
    });

    let replacements = 0;
    let unlinked = 0;
    const rewrite = value => {
        if (typeof value !== 'string') return value;
        return value.replace(/\[([^\]]+)]\((\/docs\/[^)\s]+)\)/g, (match, label, target) => {
            if (canonicalRoutes.has(target)) return match;
            const replacement = replacementByLegacyRoute.get(target);
            if (replacement) {
                replacements += 1;
                return `[${label}](${replacement})`;
            }
            unlinked += 1;
            return label;
        });
    };

    walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    ).forEach(filePath => {
        const page = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        page.sections.forEach(section => {
            if (section.paragraphs) section.paragraphs = section.paragraphs.map(rewrite);
            if (section.items) section.items = section.items.map(rewrite);
        });
        writeJson(filePath, page);
    });

    console.log(
        `Normalized ${replacements} legacy documentation links; ` +
        `kept ${unlinked} unresolved labels as non-clickable text`
    );
}

if (require.main === module) main();

module.exports = { main };
