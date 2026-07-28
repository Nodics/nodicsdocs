/*
 * Nodics - Enterprice Micro-Services Management Framework
 *
 * Copyright (c) 2026 Nodics All rights reserved.
 *
 * This software is the confidential and proprietary information of Nodics
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with Nodics.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const capabilityRoot = path.join(root, 'source', 'pages', 'capabilities');
const requiredHeading = 'Customize and extend safely';
const requiredEvidence = [
    {
        name: 'a supported project-owned extension path',
        pattern: /\b(project|later|provider|extend|custom)\b/i
    },
    {
        name: 'a prohibited framework or parallel-authority shortcut',
        pattern: /\b(do not|never|without editing|unchanged)\b/i
    },
    {
        name: 'verification evidence',
        pattern: /\b(test|verify|verification|proof)\b/i
    },
    {
        name: 'rollback or removal behavior',
        pattern: /\b(rollback|remove|removal|revert|restore)\b/i
    }
];

function listJsonFiles(directory) {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const target = path.join(directory, entry.name);
            if (entry.isDirectory()) return listJsonFiles(target);
            return entry.name.endsWith('.json') ? [target] : [];
        })
        .sort();
}

function relativeFamily(fileName) {
    return path.relative(capabilityRoot, path.dirname(fileName));
}

const families = new Map();
listJsonFiles(capabilityRoot).forEach(fileName => {
    const page = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    const family = relativeFamily(fileName);
    if (!families.has(family)) families.set(family, []);
    families.get(family).push({ fileName, page });
});

const failures = [];
families.forEach((entries, family) => {
    const customizationPages = entries.filter(({ page }) =>
        (page.sections || []).some(section => section.heading === requiredHeading)
    );
    if (!customizationPages.length) {
        failures.push(
            `${family}: no canonical page contains "${requiredHeading}"`
        );
        return;
    }

    const familyContent = JSON.stringify(entries.map(({ page }) => page));
    requiredEvidence.forEach(requirement => {
        if (!requirement.pattern.test(familyContent)) {
            failures.push(`${family}: missing ${requirement.name}`);
        }
    });
});

if (failures.length) {
    console.error('Customization-first documentation coverage failed.');
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exitCode = 1;
} else {
    console.log(
        `Customization-first documentation coverage passed for ${families.size} capability families.`
    );
}
