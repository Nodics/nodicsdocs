'use strict';

const assert = require('node:assert');
const test = require('node:test');

const { parseMarkdown, stableCode } = require('../scripts/lib/content-utils');

test('parses deterministic safe documentation blocks', () => {
    const markdown = [
        '# Title',
        '',
        'A paragraph.',
        '',
        '- one',
        '- two',
        '',
        '```js',
        'const value = true;',
        '```'
    ].join('\n');
    const result = parseMarkdown(markdown);
    assert.deepStrictEqual(result.blocks.map(block => block.kind), [
        'heading',
        'paragraph',
        'unordered-list',
        'code'
    ]);
    assert.strictEqual(result.unsupported.length, 0);
});

test('stable codes depend on source identity rather than title', () => {
    assert.strictEqual(stableCode('docsPage', 'gDocs/guide.md'), stableCode('docsPage', 'gDocs/guide.md'));
    assert.notStrictEqual(stableCode('docsPage', 'gDocs/guide.md'), stableCode('docsPage', 'gDocs/other.md'));
});

test('reports executable HTML for migration review', () => {
    const result = parseMarkdown('# Unsafe\n<script>alert(1)</script>');
    assert.deepStrictEqual(result.unsupported, ['unsafe-html:2']);
});

