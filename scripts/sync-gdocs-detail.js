'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { walkFiles, writeJson } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function articleByEvidenceId() {
    return new Map(walkFiles(
        path.join(root, 'source', 'articles'),
        filePath => filePath.endsWith('.json')
    ).map(filePath => {
        const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return [`nodics:${article.source.path}`, article];
    }));
}

function pageFilesByCode() {
    return new Map(walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    ).map(filePath => {
        const page = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return [page.code, { filePath, page }];
    }));
}

function markdownTable(block) {
    const separator = block.headers.map(() => '---');
    return [
        `| ${block.headers.join(' | ')} |`,
        `| ${separator.join(' | ')} |`,
        ...(block.rows || []).map(row => `| ${row.join(' | ')} |`)
    ].join('\n');
}

function appendBlock(section, block) {
    if (block.kind === 'paragraph') section.paragraphs.push(block.text);
    if (block.kind === 'blockquote') section.paragraphs.push(`> ${block.text}`);
    if (block.kind === 'code') {
        section.paragraphs.push(`\`\`\`${block.language || ''}\n${block.text}\n\`\`\``);
    }
    if (block.kind === 'table') section.paragraphs.push(markdownTable(block));
    if (block.kind === 'image') {
        section.paragraphs.push(`![${block.alt || ''}](${block.target})`);
    }
    if (['unordered-list', 'ordered-list'].includes(block.kind)) {
        section.items.push(...(block.items || []));
    }
}

function sectionsFromArticle(article, evidenceId) {
    const sections = [];
    let current = null;

    article.blocks.forEach(block => {
        if (block.kind === 'heading') {
            if (block.level === 1) return;
            current = {
                heading: block.text,
                migratedFrom: evidenceId,
                sourceAnchor: block.anchor,
                paragraphs: [],
                items: []
            };
            sections.push(current);
            return;
        }
        if (!current) {
            current = {
                heading: `Complete guide: ${article.title}`,
                migratedFrom: evidenceId,
                sourceAnchor: null,
                paragraphs: [],
                items: []
            };
            sections.push(current);
        }
        appendBlock(current, block);
    });

    return sections.map(section => {
            if (section.paragraphs.length === 0 && section.items.length === 0) {
                section.paragraphs.push(
                    'This heading groups the detailed subsections that immediately follow.'
                );
            }
            if (section.paragraphs.length === 0) delete section.paragraphs;
            if (section.items.length === 0) delete section.items;
            return section;
        });
}

function main() {
    const decisions = readJson('source/migration-decisions.json').decisions;
    const migrationRegister = readJson('manifest/migration-register.json');
    const articles = articleByEvidenceId();
    const pages = pageFilesByCode();
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

    const decisionsByDestination = new Map();
    eligible.forEach(decision => {
        if (!decisionsByDestination.has(decision.destinationCode)) {
            decisionsByDestination.set(decision.destinationCode, []);
        }
        decisionsByDestination.get(decision.destinationCode).push(decision);
    });

    decisionsByDestination.forEach((destinationDecisions, destinationCode) => {
        const target = pages.get(destinationCode);
        if (!target) throw new Error(`Unknown canonical destination: ${destinationCode}`);

        const evidenceIds = new Set(destinationDecisions.map(decision => decision.evidenceId));
        target.page.sections = target.page.sections.filter(section =>
            !evidenceIds.has(section.migratedFrom)
        );
        target.page.supportingEvidence = [...new Set([
            ...(target.page.supportingEvidence || []),
            ...evidenceIds
        ])];

        destinationDecisions.forEach(decision => {
            const article = articles.get(decision.evidenceId);
            if (!article) throw new Error(`Missing extracted article: ${decision.evidenceId}`);
            target.page.sections.push(...sectionsFromArticle(article, decision.evidenceId));
        });
        writeJson(target.filePath, target.page);
    });

    console.log(
        `Synchronized complete instructional detail from ${entryPointAndGDocs.length} entry-point and gDocs sources ` +
        `and ${specializedModuleDocuments.length} specialized module documents ` +
        `into ${decisionsByDestination.size} canonical pages`
    );
}

if (require.main === module) main();

module.exports = { main, sectionsFromArticle };
