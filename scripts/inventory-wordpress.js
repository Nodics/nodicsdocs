'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { hash, writeJson } = require('./lib/content-utils');

function argument(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : fallback;
}

function parseTuple(tuple) {
    const values = [];
    let value = '';
    let quoted = false;
    let escaped = false;
    for (let index = 0; index < tuple.length; index += 1) {
        const character = tuple[index];
        if (escaped) {
            value += character;
            escaped = false;
        } else if (character === '\\') {
            escaped = true;
        } else if (character === "'") {
            quoted = !quoted;
        } else if (character === ',' && !quoted) {
            const normalized = value.trim();
            values.push(normalized === 'NULL' ? null : normalized);
            value = '';
        } else {
            value += character;
        }
    }
    const normalized = value.trim();
    values.push(normalized === 'NULL' ? null : normalized);
    return values;
}

function tableRows(sql, table) {
    const rows = [];
    const pattern = new RegExp(
        `INSERT INTO \\\`${table}\\\` \\(([^;]+?)\\) VALUES\\s*([\\s\\S]*?);`,
        'g'
    );
    let insert;
    while ((insert = pattern.exec(sql)) !== null) {
        const columns = insert[1].split(',').map(column => column.replaceAll('`', '').trim());
        const values = insert[2];
        let quoted = false;
        let escaped = false;
        let depth = 0;
        let start = -1;
        for (let index = 0; index < values.length; index += 1) {
            const character = values[index];
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === "'") quoted = !quoted;
            else if (!quoted && character === '(') {
                if (depth === 0) start = index + 1;
                depth += 1;
            } else if (!quoted && character === ')') {
                depth -= 1;
                if (depth === 0 && start >= 0) {
                    const parsed = parseTuple(values.slice(start, index));
                    rows.push(Object.fromEntries(columns.map((column, offset) => [column, parsed[offset]])));
                    start = -1;
                }
            }
        }
    }
    return rows;
}

function stripHtml(value) {
    return value
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function main() {
    const root = path.resolve(__dirname, '..');
    const archive = path.resolve(argument(
    'archive',
    path.join(root, '..', '..', '..', 'Downloads', 'nodicswebsite-nodicsweb-c067d7160b9f.zip')
    ));
    if (!fs.existsSync(archive)) throw new Error(`WordPress archive not found: ${archive}`);

    const entries = childProcess.execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' })
        .split('\n')
        .filter(entry => /ThemeBackup\/Data\/.*\.sql$/.test(entry));
    const requested = argument('sql-entry', '');
    const sqlEntry = requested || entries.find(entry => /nodicsweb_18_03_2019\.sql$/.test(entry));
    if (!sqlEntry) throw new Error('No reviewed WordPress SQL snapshot was selected');
    const sql = childProcess.execFileSync('unzip', ['-p', archive, sqlEntry], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024
    });
    const posts = tableRows(sql, 'wp_posts');
    const published = posts.filter(post =>
        post.post_status === 'publish' && ['page', 'post'].includes(post.post_type)
    );
    const pages = published.map(post => {
    const content = post.post_content || '';
    const headings = [];
    const headingPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let heading;
    while ((heading = headingPattern.exec(content)) !== null) {
        headings.push({ level: Number(heading[1]), text: stripHtml(heading[2]) });
    }
    return {
        legacyId: Number(post.ID),
        type: post.post_type,
        title: stripHtml(post.post_title || ''),
        slug: post.post_name,
        parentId: Number(post.post_parent || 0),
        menuOrder: Number(post.menu_order || 0),
        modifiedAt: post.post_modified_gmt || post.post_modified,
        headings,
        contentHash: hash(content)
    };
    }).sort((left, right) =>
    left.type.localeCompare(right.type) ||
    left.parentId - right.parentId ||
    left.menuOrder - right.menuOrder ||
    left.title.localeCompare(right.title)
    );
    const attachments = posts.filter(post => post.post_type === 'attachment').map(post => ({
        legacyId: Number(post.ID),
        title: stripHtml(post.post_title || ''),
        mimeType: post.post_mime_type || '',
        parentId: Number(post.post_parent || 0)
    }));

    writeJson(path.join(root, 'manifest', 'wordpress-reference.json'), {
    source: {
        archiveName: path.basename(archive),
        sqlEntry,
        sqlHash: hash(sql)
    },
    safety: {
        excluded: ['users', 'credentials', 'options', 'comments', 'plugins', 'raw post content'],
        purpose: 'Historical information architecture and page reconciliation only'
    },
    publishedCount: pages.length,
    publishedPages: pages.filter(page => page.type === 'page').length,
    publishedPosts: pages.filter(page => page.type === 'post').length,
    attachmentCount: attachments.length,
    pages,
    attachments
    });
    console.log(`Inventoried ${pages.length} published WordPress pages/posts and ${attachments.length} attachments`);
}

if (require.main === module) main();

module.exports = { main, parseTuple, tableRows };
