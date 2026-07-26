'use strict';

const assert = require('node:assert');
const test = require('node:test');

const { hash, parseMarkdown, stableCode } = require('../scripts/lib/content-utils');

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

test('changed and new canonical pages preserve update-versus-create identity', () => {
    const original = { code: 'capability.example.overview', title: 'Example', sections: [] };
    const changed = {
        ...original,
        sections: [{ heading: 'Updated', paragraphs: ['Changed content.'] }]
    };
    const added = { code: 'capability.example.guide', title: 'Example guide', sections: [] };

    assert.strictEqual(
        stableCode('docsPage', original.code),
        stableCode('docsPage', changed.code)
    );
    assert.notStrictEqual(hash(JSON.stringify(original)), hash(JSON.stringify(changed)));
    assert.notStrictEqual(
        stableCode('docsPage', original.code),
        stableCode('docsPage', added.code)
    );
});

test('reports executable HTML for migration review', () => {
    const result = parseMarkdown('# Unsafe\n<script>alert(1)</script>');
    assert.deepStrictEqual(result.unsupported, ['unsafe-html:2']);
});
