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
    const canonicalPages = readJson('source/canonical-pages.json');
    const decisions = readJson('source/migration-decisions.json');
    const wordpress = readJson('manifest/wordpress-reference.json');
    const articles = walkFiles(
        path.join(root, 'source', 'articles'),
        filePath => filePath.endsWith('.json')
    ).map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));
    const decisionByEvidence = new Map(
        decisions.decisions.map(decision => [decision.evidenceId, decision])
    );
    const sectionSet = new Set(taxonomy.sections.map(section => section.code));
    const capabilitySet = new Set(taxonomy.capabilities.map(capability => capability.code));
    const pageFamilySet = new Set(taxonomy.pageFamilies);
    const canonicalPageCodes = canonicalPages.pages.map(page => page.code);
    if (new Set(canonicalPageCodes).size !== canonicalPageCodes.length) {
        throw new Error('Duplicate canonical page code');
    }
    canonicalPages.pages.forEach(page => {
        if (!sectionSet.has(page.section)) throw new Error(`Unknown section for ${page.code}`);
        if (page.capability && !capabilitySet.has(page.capability)) {
            throw new Error(`Unknown capability for ${page.code}`);
        }
        if (!pageFamilySet.has(page.family)) throw new Error(`Unknown page family for ${page.code}`);
    });
    if (decisionByEvidence.size !== decisions.decisions.length) {
        throw new Error('Duplicate migration decision evidenceId');
    }
    const dispositionSet = new Set(taxonomy.dispositions);
    const destinationSet = new Set(canonicalPageCodes);
    decisions.decisions.forEach(decision => {
        if (!dispositionSet.has(decision.disposition)) {
            throw new Error(`Unsupported disposition for ${decision.evidenceId}`);
        }
        if (decision.destinationCode && !destinationSet.has(decision.destinationCode)) {
            throw new Error(`Unknown destination ${decision.destinationCode} for ${decision.evidenceId}`);
        }
        if (['retain', 'merge', 'rewrite'].includes(decision.disposition) && !decision.destinationCode) {
            throw new Error(`Destination required for ${decision.evidenceId}`);
        }
        if (['archive', 'reject'].includes(decision.disposition) && decision.destinationCode) {
            throw new Error(`Destination is not allowed for ${decision.evidenceId}`);
        }
        if (!decision.notes) throw new Error(`Missing decision notes for ${decision.evidenceId}`);
    });
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
