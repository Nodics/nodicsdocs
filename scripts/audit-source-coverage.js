'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { walkFiles } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');
const errors = [];

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function countWords(value) {
    return JSON.stringify(value || '')
        .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
        .replace(/[^A-Za-z0-9'’-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
}

function sourceContent(article) {
    return article.blocks.flatMap(block => {
        if (block.kind === 'heading') return block.level > 1 ? [block.text] : [];
        if (block.kind === 'table') return [...(block.headers || []), ...(block.rows || []).flat()];
        if (['unordered-list', 'ordered-list'].includes(block.kind)) return block.items || [];
        return [block.text, block.alt].filter(Boolean);
    });
}

function migratedContent(sections) {
    return sections.flatMap(section => [
        section.heading,
        ...(section.paragraphs || []),
        ...(section.items || [])
    ]);
}

const decisions = readJson('source/migration-decisions.json').decisions;
const migrationRegister = readJson('manifest/migration-register.json');
const articles = new Map(walkFiles(
    path.join(root, 'source', 'articles'),
    filePath => filePath.endsWith('.json')
).map(filePath => {
    const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return [`nodics:${article.source.path}`, article];
}));
const pages = new Map(walkFiles(
    path.join(root, 'source', 'pages'),
    filePath => filePath.endsWith('.json')
).map(filePath => {
    const page = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return [page.code, page];
}));

const entryPointAndGDocs = decisions.filter(decision =>
    (
        decision.evidenceId === 'nodics:README.md' ||
        decision.evidenceId.startsWith('nodics:gDocs/')
    ) &&
    ['merge', 'rewrite', 'retain'].includes(decision.disposition)
);
const specializedModuleDocuments = migrationRegister.entries
    .filter(entry =>
        entry.sourceType === 'module-doc' &&
        !entry.sourcePath.endsWith('/docs/README.md') &&
        ['merge', 'rewrite', 'retain'].includes(entry.disposition)
    )
    .map(entry => ({
        evidenceId: entry.evidenceId,
        disposition: entry.disposition,
        destinationCode: entry.destinationCode
    }));
const eligible = [...entryPointAndGDocs, ...specializedModuleDocuments];

eligible.forEach(decision => {
    const article = articles.get(decision.evidenceId);
    const page = pages.get(decision.destinationCode);
    if (!article) {
        errors.push(`Missing extracted source: ${decision.evidenceId}`);
        return;
    }
    if (!page) {
        errors.push(`Missing destination page: ${decision.destinationCode}`);
        return;
    }
    if (!(page.supportingEvidence || []).includes(decision.evidenceId)) {
        errors.push(`Destination does not cite source: ${decision.evidenceId}`);
    }
    const migratedSections = page.sections.filter(section =>
        section.migratedFrom === decision.evidenceId
    );
    const sourceHeadings = article.headings
        .filter(heading => heading.level > 1)
        .map(heading => heading.text);
    const migratedHeadings = new Set(migratedSections.map(section => section.heading));
    sourceHeadings.filter(heading => !migratedHeadings.has(heading))
        .forEach(heading => errors.push(`Missing heading "${heading}": ${decision.evidenceId}`));

    const sourceWords = countWords(sourceContent(article));
    const migratedWords = countWords(migratedContent(migratedSections));
    if (sourceWords > 0 && migratedWords / sourceWords < 0.9) {
        errors.push(
            `Detail loss ${migratedWords}/${sourceWords} words: ${decision.evidenceId}`
        );
    }
});

console.log(
    `Sources requiring preservation: ${eligible.length} ` +
    `(${entryPointAndGDocs.length} entry-point and gDocs, ` +
    `${specializedModuleDocuments.length} specialized module documents)`
);
console.log(`Sources with complete canonical detail: ${eligible.length - new Set(
    errors.map(error => error.split(': nodics:')[1]).filter(Boolean)
).size}`);
if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log('Source-coverage contract satisfied: no mapped instructional guide lost detail');
}
