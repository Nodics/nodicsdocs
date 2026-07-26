const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SUPPORTED_BLOCKS = new Set([
    'heading',
    'image',
    'paragraph',
    'unordered-list',
    'ordered-list',
    'blockquote',
    'code',
    'table'
]);

function hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function stableCode(prefix, identity) {
    return `${prefix}${hash(identity).slice(0, 20)}`;
}

function slug(value) {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'index';
}

function titleFromPath(filePath) {
    const name = path.basename(filePath, path.extname(filePath));
    return name.toLowerCase() === 'readme' ? path.basename(path.dirname(filePath)) : name;
}

function parseMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    const headings = [];
    const unsupported = [];
    let index = 0;
    let paragraph = [];

    function flushParagraph() {
        if (paragraph.length > 0) {
            blocks.push({ kind: 'paragraph', text: paragraph.join(' ').trim() });
            paragraph = [];
        }
    }

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();
        if (trimmed === '') {
            flushParagraph();
            index += 1;
            continue;
        }
        if (/^```/.test(trimmed)) {
            flushParagraph();
            const language = trimmed.slice(3).trim();
            const content = [];
            index += 1;
            while (index < lines.length && !/^```/.test(lines[index].trim())) {
                content.push(lines[index]);
                index += 1;
            }
            if (index >= lines.length) unsupported.push('unclosed-code-fence');
            else index += 1;
            blocks.push({ kind: 'code', language, text: content.join('\n') });
            continue;
        }
        const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            flushParagraph();
            const level = heading[1].length;
            const text = heading[2].replace(/\s+#+$/, '').trim();
            const anchor = slug(text);
            headings.push({ level, text, anchor });
            blocks.push({ kind: 'heading', level, text, anchor });
            index += 1;
            continue;
        }
        const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']+)["'])?\)$/);
        if (image) {
            flushParagraph();
            blocks.push({
                kind: 'image',
                alt: image[1],
                target: image[2],
                title: image[3] || ''
            });
            index += 1;
            continue;
        }
        const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
        const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
        if (unordered || ordered) {
            flushParagraph();
            const kind = unordered ? 'unordered-list' : 'ordered-list';
            const items = [];
            while (index < lines.length) {
                const match = lines[index].trim().match(
                    kind === 'unordered-list' ? /^[-*+]\s+(.+)$/ : /^\d+[.)]\s+(.+)$/
                );
                if (!match) break;
                items.push(match[1].trim());
                index += 1;
            }
            blocks.push({ kind, items });
            continue;
        }
        if (/^>\s?/.test(trimmed)) {
            flushParagraph();
            const quote = [];
            while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
                quote.push(lines[index].trim().replace(/^>\s?/, ''));
                index += 1;
            }
            blocks.push({ kind: 'blockquote', text: quote.join(' ') });
            continue;
        }
        if (
            index + 1 < lines.length &&
            trimmed.includes('|') &&
            /^\s*\|?[\s:|-]+\|[\s:|-]*\|?\s*$/.test(lines[index + 1])
        ) {
            flushParagraph();
            const rows = [];
            rows.push(trimmed.split('|').map(value => value.trim()).filter(Boolean));
            index += 2;
            while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
                rows.push(lines[index].trim().split('|').map(value => value.trim()).filter(Boolean));
                index += 1;
            }
            blocks.push({ kind: 'table', headers: rows[0], rows: rows.slice(1) });
            continue;
        }
        if (/<\s*(script|iframe|object|embed|style)\b/i.test(trimmed) || /\son[a-z]+\s*=/i.test(trimmed)) {
            unsupported.push(`unsafe-html:${index + 1}`);
        }
        paragraph.push(trimmed);
        index += 1;
    }
    flushParagraph();
    return { blocks, headings, unsupported };
}

function markdownReferences(markdown) {
    const images = [];
    const links = [];
    const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']+)["'])?\)/g;
    const linkPattern = /(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']+["'])?\)/g;
    let match;
    while ((match = imagePattern.exec(markdown)) !== null) {
        images.push({ alt: match[1], target: match[2], title: match[3] || '' });
    }
    while ((match = linkPattern.exec(markdown)) !== null) {
        links.push({ label: match[1], target: match[2] });
    }
    return { images, links };
}

function walkFiles(root, predicate) {
    const files = [];
    function walk(directory) {
        fs.readdirSync(directory, { withFileTypes: true })
            .sort((left, right) => left.name.localeCompare(right.name))
            .forEach(entry => {
                if (['.git', 'node_modules', 'llm', 'gen'].includes(entry.name)) return;
                const target = path.join(directory, entry.name);
                if (entry.isDirectory()) walk(target);
                else if (predicate(target)) files.push(target);
            });
    }
    walk(root);
    return files;
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCommonJsRecords(filePath, records, description, sourceAuthority = 'source/pages') {
    const keyed = Object.fromEntries(records.map((record, index) => [`record${index}`, record]));
    const content = [
        "'use strict';",
        '',
        '/**',
        ` * @description ${description}`,
        ` * @generated This file is generated from ${sourceAuthority}. Do not edit manually.`,
        ' */',
        `module.exports = ${JSON.stringify(keyed, null, 4)};`,
        ''
    ].join('\n');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

module.exports = {
    SUPPORTED_BLOCKS,
    hash,
    markdownReferences,
    parseMarkdown,
    slug,
    stableCode,
    titleFromPath,
    walkFiles,
    writeCommonJsRecords,
    writeJson
};
