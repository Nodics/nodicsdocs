'use strict';

const assert = require('node:assert');
const test = require('node:test');

const inventory = require('../scripts/inventory-wordpress');

test('parses escaped WordPress SQL tuple values', () => {
    assert.deepStrictEqual(
        inventory.parseTuple("1,'Nodics\\' Guide',NULL,'publish'"),
        ['1', "Nodics' Guide", null, 'publish']
    );
});

test('extracts only the requested SQL table shape', () => {
    const sql = [
        "INSERT INTO `wp_posts` (`ID`, `post_title`, `post_status`) VALUES",
        "(1, 'Guide', 'publish'),",
        "(2, 'Draft', 'draft');"
    ].join('\n');
    assert.deepStrictEqual(inventory.tableRows(sql, 'wp_posts'), [
        { ID: '1', post_title: 'Guide', post_status: 'publish' },
        { ID: '2', post_title: 'Draft', post_status: 'draft' }
    ]);
});

