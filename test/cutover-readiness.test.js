'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('cutover audit records canonical completeness and honest release blockers', () => {
    const report = JSON.parse(
        fs.readFileSync(path.join(root, 'manifest', 'cutover-readiness.json'), 'utf8')
    );
    const byCode = new Map(report.checks.map(check => [check.code, check]));

    assert.equal(byCode.get('canonical-completeness').status, 'PASS');
    assert.equal(byCode.get('canonical-completeness').evidence.registered, 159);
    assert.equal(byCode.get('canonical-completeness').evidence.authored, 159);
    assert.equal(byCode.get('canonical-navigation-links').status, 'PASS');
    assert.equal(byCode.get('migration-disposition-completeness').status, 'PASS');

    assert.equal(byCode.get('canonical-content-pack-projection').status, 'PASS');
    assert.equal(byCode.get('canonical-content-pack-projection').evidence.generatedArticles, 159);
    assert.equal(byCode.get('canonical-content-pack-projection').evidence.legacyArticles, 424);
    assert.match(
        byCode.get('canonical-content-pack-projection').evidence.note,
        /source\/pages/i
    );
    assert.notEqual(report.decision, 'GO');
});
