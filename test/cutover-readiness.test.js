'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function canonicalPageCount() {
    const { walkFiles } = require('../scripts/lib/content-utils');
    return walkFiles(
        path.join(root, 'source', 'pages'),
        filePath => filePath.endsWith('.json')
    ).length;
}

test('cutover audit records canonical completeness and honest release blockers', () => {
    const report = JSON.parse(
        fs.readFileSync(path.join(root, 'manifest', 'cutover-readiness.json'), 'utf8')
    );
    const byCode = new Map(report.checks.map(check => [check.code, check]));
    const authoredPages = canonicalPageCount();

    assert.equal(byCode.get('canonical-completeness').status, 'PASS');
    assert.equal(byCode.get('canonical-completeness').evidence.registered, authoredPages);
    assert.equal(byCode.get('canonical-completeness').evidence.authored, authoredPages);
    assert.equal(byCode.get('canonical-navigation-links').status, 'PASS');
    assert.equal(byCode.get('migration-disposition-completeness').status, 'PASS');

    assert.equal(byCode.get('canonical-content-pack-projection').status, 'PASS');
    assert.equal(byCode.get('canonical-content-pack-projection').evidence.generatedArticles, authoredPages);
    assert.equal(
        byCode.get('canonical-content-pack-projection').evidence.legacyArticles,
        byCode.get('migration-disposition-completeness').evidence.sources.nodics
    );
    assert.match(
        byCode.get('canonical-content-pack-projection').evidence.note,
        /source\/pages/i
    );
    assert.notEqual(report.decision, 'GO');
});
