'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = path.resolve(__dirname, '..', 'source', 'pages');
const MINIMUMS = {
    overview: { words: 300, sections: 5 },
    'business-value': { words: 250, sections: 4 },
    concepts: { words: 300, sections: 5 },
    architecture: { words: 350, sections: 5 },
    'runtime-behavior': { words: 300, sections: 5 },
    configuration: { words: 300, sections: 5 },
    customization: { words: 300, sections: 5 },
    tutorial: { words: 400, sections: 7 },
    operations: { words: 300, sections: 5 },
    security: { words: 300, sections: 5 },
    'technical-reference': { words: 350, sections: 6 }
};

const listJsonFiles = function (directory, result = []) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            listJsonFiles(entryPath, result);
        } else if (entry.name.endsWith('.json')) {
            result.push(entryPath);
        }
    });
    return result;
};

const countWords = function (value) {
    return JSON.stringify(value || [])
        .replace(/[^A-Za-z0-9'’-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
};

const pages = listJsonFiles(SOURCE_ROOT).map((filePath) => {
    const page = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const minimum = MINIMUMS[page.family] || { words: 250, sections: 4 };
    const words = countWords(page.sections);
    const sections = Array.isArray(page.sections) ? page.sections.length : 0;

    return {
        code: page.code,
        family: page.family,
        words,
        sections,
        minimumWords: minimum.words,
        minimumSections: minimum.sections,
        needsReview: words < minimum.words || sections < minimum.sections,
        file: path.relative(path.resolve(__dirname, '..'), filePath)
    };
});

const gaps = pages
    .filter((page) => page.needsReview)
    .sort((left, right) => {
        const leftRatio = left.words / left.minimumWords;
        const rightRatio = right.words / right.minimumWords;
        return leftRatio - rightRatio || left.code.localeCompare(right.code);
    });

console.log(`Canonical pages: ${pages.length}`);
console.log(`Pages meeting the initial depth benchmark: ${pages.length - gaps.length}`);
console.log(`Pages requiring editorial review: ${gaps.length}`);

gaps.forEach((page) => {
    console.log(
        `${page.code}\t${page.family}\t${page.words}/${page.minimumWords} words\t` +
        `${page.sections}/${page.minimumSections} sections\t${page.file}`
    );
});

if (gaps.length > 0) {
    process.exitCode = 1;
}
