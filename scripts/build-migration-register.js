'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { writeJson, walkFiles } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function normalizedEvidence(entry) {
    const sourcePath = (entry.source?.path || '')
        .replaceAll(/(^|\/)(gFramework|gCore|gContent|gComm|gExp|gAi|gDeap|gOptional|docs)(\/|$)/g, ' ')
        .replaceAll(/readme\.md/gi, ' ')
        .replaceAll(/module/gi, ' ');
    return [
        entry.title,
        entry.route,
        sourcePath,
        ...(entry.headings || []).map(heading => heading.text)
    ].filter(Boolean).join(' ').toLowerCase();
}

function suggestedCapability(entry, taxonomy) {
    const evidence = normalizedEvidence(entry);
    const matches = taxonomy.capabilities.map(capability => ({
        code: capability.code,
        score: capability.aliases.reduce(
            (score, alias) => score + (evidence.includes(alias.toLowerCase()) ? 1 : 0),
            0
        )
    })).filter(match => match.score > 0)
        .sort((left, right) => right.score - left.score || left.code.localeCompare(right.code));
    return matches[0]?.code || null;
}

function main() {
    const taxonomy = readJson('source/navigation-taxonomy.json');
    const decisions = readJson('source/migration-decisions.json');
    const wordpress = readJson('manifest/wordpress-reference.json');
    const articles = walkFiles(
        path.join(root, 'source', 'articles'),
        filePath => filePath.endsWith('.json')
    ).map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));
    const decisionByEvidence = new Map(
        decisions.decisions.map(decision => [decision.evidenceId, decision])
    );
    const evidence = articles.map(article => ({
        evidenceId: `nodics:${article.source.path}`,
        sourceType: article.source.type,
        sourcePath: article.source.path,
        title: article.title,
        currentRoute: article.route,
        contentHash: article.source.contentHash,
        suggestedCapability: suggestedCapability(article, taxonomy)
    })).concat(wordpress.pages.map(page => ({
        evidenceId: `wordpress:${page.type}:${page.legacyId}`,
        sourceType: `wordpress-${page.type}`,
        sourcePath: `${wordpress.source.sqlEntry}#${page.legacyId}`,
        title: page.title,
        currentRoute: page.slug ? `/legacy/${page.slug}` : null,
        contentHash: page.contentHash,
        suggestedCapability: suggestedCapability({
            title: page.title,
            route: page.slug,
            headings: page.headings
        }, taxonomy)
    }))).sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
    const entries = evidence.map(item => {
        const decision = decisionByEvidence.get(item.evidenceId);
        return {
            ...item,
            reviewStatus: decision ? 'reviewed' : 'pending',
            disposition: decision?.disposition || null,
            destinationCode: decision?.destinationCode || null,
            notes: decision?.notes || null
        };
    });
    const unknownDecisionIds = decisions.decisions
        .map(decision => decision.evidenceId)
        .filter(evidenceId => !entries.some(entry => entry.evidenceId === evidenceId));
    writeJson(path.join(root, 'manifest', 'migration-register.json'), {
        contractVersion: 1,
        taxonomyContractVersion: taxonomy.contractVersion,
        sources: {
            nodics: articles.length,
            wordpress: wordpress.pages.length,
            total: entries.length
        },
        review: {
            reviewed: entries.filter(entry => entry.reviewStatus === 'reviewed').length,
            pending: entries.filter(entry => entry.reviewStatus === 'pending').length,
            unknownDecisionIds
        },
        entries
    });
    console.log(
        `Registered ${entries.length} migration evidence items ` +
        `(${entries.filter(entry => entry.reviewStatus === 'reviewed').length} reviewed)`
    );
}

if (require.main === module) main();

module.exports = { main, suggestedCapability };
