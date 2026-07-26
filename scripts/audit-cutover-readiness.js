'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { walkFiles, writeJson } = require('./lib/content-utils');

const root = path.resolve(__dirname, '..');

function argument(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : fallback;
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function countFiles(directory, predicate) {
    if (!fs.existsSync(directory)) return 0;
    return walkFiles(directory, predicate).length;
}

function canonicalLinks(page) {
    const links = [];
    (page.sections || []).forEach(section => {
        (section.links || []).forEach(link => {
            if (link.target) links.push(link.target);
        });
        ['paragraphs', 'items'].forEach(field => {
            (section[field] || []).forEach(text => {
                for (const match of text.matchAll(/\[[^\]]+\]\((\/docs\/[^)#?]+)(?:#[^)]+)?\)/g)) {
                    links.push(match[1]);
                }
            });
        });
    });
    return links;
}

function countNodicsGdocsLinks(nodicsRoot) {
    if (!nodicsRoot || !fs.existsSync(nodicsRoot)) return null;
    const sourceFiles = walkFiles(nodicsRoot, filePath =>
        /\.(md|js|json)$/.test(filePath) &&
        !filePath.includes(`${path.sep}node_modules${path.sep}`) &&
        !filePath.includes(`${path.sep}.git${path.sep}`) &&
        !filePath.includes(`${path.sep}gDocs${path.sep}`) &&
        !filePath.includes(`${path.sep}docs${path.sep}archive${path.sep}`)
    );
    let files = 0;
    let references = 0;
    sourceFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/(?:^|[("'`\s])(?:\.\.\/)*gDocs\//gm) || [];
        if (matches.length > 0) {
            files += 1;
            references += matches.length;
        }
    });
    return { files, references };
}

function main() {
    const registry = readJson('source/canonical-pages.json');
    const taxonomy = readJson('source/navigation-taxonomy.json');
    const migration = readJson('manifest/migration-register.json');
    const generated = readJson('manifest/generated-content-pack.json');
    const pageFiles = walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    );
    const pages = pageFiles.map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));
    const routeSet = new Set(pages.map(page => page.route));
    const codeSet = new Set(pages.map(page => page.code));
    const registeredCodes = registry.pages.map(page => page.code);
    const missingAuthored = registeredCodes.filter(code => !codeSet.has(code));
    const unregisteredAuthored = pages.map(page => page.code)
        .filter(code => !registeredCodes.includes(code));
    const brokenLinks = pages.flatMap(page =>
        canonicalLinks(page)
            .filter(target => !routeSet.has(target))
            .map(target => ({ page: page.code, target }))
    );
    const sectionCounts = Object.fromEntries(taxonomy.sections.map(section => [
        section.code,
        pages.filter(page => page.section === section.code).length
    ]));
    const audienceCounts = Object.fromEntries([
        'evaluator', 'business-user', 'administrator', 'developer', 'architect',
        'security-reviewer', 'operator', 'framework-maintainer', 'ai-tool'
    ].map(audience => [
        audience,
        pages.filter(page => page.audiences.includes(audience)).length
    ]));
    const dispositions = {};
    migration.entries.forEach(entry => {
        const key = entry.disposition || 'pending';
        dispositions[key] = (dispositions[key] || 0) + 1;
    });
    const invalidDestinations = migration.entries.filter(entry =>
        entry.destinationCode && !codeSet.has(entry.destinationCode)
    ).map(entry => entry.evidenceId);
    const legacyArticleCount = countFiles(
        path.join(root, 'source', 'articles'),
        filePath => filePath.endsWith('.json')
    );
    const nodicsRoot = path.resolve(
        argument('nodics-root', path.join(root, '..', 'nodics'))
    );
    const gdocsReferences = countNodicsGdocsLinks(nodicsRoot);

    const checks = [
        {
            code: 'canonical-completeness',
            status: missingAuthored.length === 0 && unregisteredAuthored.length === 0
                ? 'PASS'
                : 'BLOCKED',
            evidence: {
                registered: registeredCodes.length,
                authored: pages.length,
                missingAuthored,
                unregisteredAuthored
            }
        },
        {
            code: 'canonical-navigation-links',
            status: brokenLinks.length === 0 ? 'PASS' : 'BLOCKED',
            evidence: {
                routes: routeSet.size,
                canonicalLinks: pages.reduce(
                    (total, page) => total + canonicalLinks(page).length,
                    0
                ),
                brokenLinks,
                sectionCounts
            }
        },
        {
            code: 'audience-discoverability-source',
            status: Object.values(audienceCounts).every(count => count > 0) ? 'PASS' : 'BLOCKED',
            evidence: {
                audienceCounts,
                capabilityAliases: taxonomy.capabilities.reduce(
                    (total, capability) => total + capability.aliases.length,
                    0
                ),
                note: 'Canonical source has titles, summaries, intent, audiences, content, and taxonomy aliases. Runtime search behavior still requires the canonical CMS projection and Axis validation.'
            }
        },
        {
            code: 'migration-disposition-completeness',
            status: migration.review.pending === 0 &&
                migration.review.unknownDecisionIds.length === 0 &&
                invalidDestinations.length === 0
                ? 'PASS'
                : 'BLOCKED',
            evidence: {
                sources: migration.sources,
                review: migration.review,
                dispositions,
                invalidDestinations
            }
        },
        {
            code: 'canonical-content-pack-projection',
            status: generated.sourceMode === 'canonical' &&
                generated.sourceAuthority === 'source/pages' &&
                generated.articles === pages.length &&
                generated.pages === pages.length + generated.retiredPages &&
                generated.routes ===
                    (pages.length + generated.retiredPages) * generated.sites.length &&
                generated.legacySnapshotArticles === legacyArticleCount
                ? 'PASS'
                : 'BLOCKED',
            evidence: {
                canonicalPages: pages.length,
                legacyArticles: legacyArticleCount,
                generatedArticles: generated.articles,
                generatedPages: generated.pages,
                generatedRoutes: generated.routes,
                sites: generated.sites,
                note: generated.sourceMode === 'canonical'
                    ? 'The release generator projects source/pages. source/articles remains an isolated, non-published legacy snapshot.'
                    : 'The release generator does not yet project source/pages.'
            }
        },
        {
            code: 'runtime-import-update-removal',
            status: 'PENDING',
            evidence: {
                required: [
                    'initial canonical import',
                    'unchanged same-version rejection or no-op according to release contract',
                    'new-version changed-page update',
                    'new-page addition',
                    'removed-page deactivation or governed retention',
                    'partial failure and retry',
                    'audit and rollback evidence'
                ],
                note: 'This requires Nodics runtime integration after a canonical content pack exists.'
            }
        },
        {
            code: 'axis-rendering-search-responsive',
            status: 'PENDING',
            evidence: {
                required: [
                    'navigation hierarchy and expansion',
                    'search by title, summary, content, audience, capability, and technical alias',
                    'previous, next, related, and inline links',
                    'headings, lists, inline code, code blocks, tables, images, and tooltips',
                    'light/dark contrast and focus states',
                    'desktop, tablet, mobile, and mobile-webview layouts',
                    'authenticated access and unavailable-content recovery'
                ],
                note: 'This requires importing the canonical pack and exercising Axis renderers.'
            }
        },
        {
            code: 'gdocs-link-retirement',
            status: gdocsReferences && gdocsReferences.references === 0 ? 'PASS' : 'BLOCKED',
            evidence: {
                nodicsRootAvailable: gdocsReferences !== null,
                remainingReferencesOutsideGdocs: gdocsReferences,
                note: 'Do not remove gDocs until active navigation, source links, generated context, and module README links use canonical destinations.'
            }
        }
    ];
    const blockers = checks.filter(check => check.status === 'BLOCKED').map(check => check.code);
    const pending = checks.filter(check => check.status === 'PENDING').map(check => check.code);
    const report = {
        contractVersion: 1,
        generatedAt: new Date().toISOString(),
        decision: blockers.length === 0 && pending.length === 0 ? 'GO' : 'NO_GO',
        blockers,
        pending,
        checks
    };
    writeJson(path.join(root, 'manifest', 'cutover-readiness.json'), report);

    const blockingWork = [];
    if (blockers.includes('canonical-content-pack-projection')) {
        blockingWork.push(
            'Change the content-pack generator and validators to project `source/pages` into CMS records while preserving the legacy snapshot.'
        );
    }
    if (pending.includes('runtime-import-update-removal')) {
        blockingWork.push(
            'Run Nodics integration acceptance for initial import, unchanged release, changed release, addition, retirement, failure/retry, audit, and rollback.'
        );
    }
    if (pending.includes('axis-rendering-search-responsive')) {
        blockingWork.push(
            'Import the canonical pack and run Axis navigation, search, rendering, accessibility, contrast, responsive, and mobile-webview acceptance.'
        );
    }
    if (blockers.includes('gdocs-link-retirement')) {
        blockingWork.push(
            'Replace remaining active `gDocs` references, then produce the module README reduction and `gDocs` archive/retirement manifest.'
        );
    }
    const lines = [
        '# Documentation Cutover Readiness',
        '',
        `Decision: **${report.decision.replace('_', '-')}**`,
        '',
        `Canonical pages: **${pages.length}/${registeredCodes.length}**`,
        '',
        `Migration evidence: **${migration.review.reviewed}/${migration.sources.total} reviewed**`,
        '',
        `Current generated release: **${generated.articles} canonical pages** from \`${generated.sourceAuthority}\``,
        '',
        '## Automated checks',
        '',
        '| Check | Status |',
        '| --- | --- |',
        ...checks.map(check => `| ${check.code} | ${check.status} |`),
        '',
        '## Blocking work',
        '',
        ...blockingWork.map((item, index) => `${index + 1}. ${item}`),
        '',
        'No legacy article, `gDocs` file, or module README should be deleted during these steps.',
        '',
        'Machine-readable evidence: `manifest/cutover-readiness.json`.'
    ];
    fs.writeFileSync(
        path.join(root, 'docs', 'cutover-readiness.md'),
        `${lines.join('\n')}\n`
    );
    console.log(
        `Cutover audit: ${report.decision} ` +
        `(${blockers.length} blocked, ${pending.length} pending)`
    );
}

if (require.main === module) main();

module.exports = { canonicalLinks, main };
