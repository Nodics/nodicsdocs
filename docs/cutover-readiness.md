# Documentation Cutover Readiness

Decision: **NO-GO**

Canonical pages: **159/159**

Migration evidence: **449/449 reviewed**

Current generated release: **424 legacy articles**, not 159 canonical pages

## Automated checks

| Check | Status |
| --- | --- |
| canonical-completeness | PASS |
| canonical-navigation-links | PASS |
| audience-discoverability-source | PASS |
| migration-disposition-completeness | PASS |
| canonical-content-pack-projection | BLOCKED |
| runtime-import-update-removal | PENDING |
| axis-rendering-search-responsive | PENDING |
| gdocs-link-retirement | BLOCKED |

## Blocking work

1. Change the content-pack generator and validators to project `source/pages` into CMS records while preserving the legacy snapshot until approval.
2. Define governed removal/deactivation behavior so a removed canonical page does not remain active forever after `saveAll` updates.
3. Run Nodics integration acceptance for initial import, unchanged release, changed release, addition, removal, failure/retry, audit, and rollback.
4. Import the canonical pack and run Axis navigation, search, rendering, accessibility, contrast, responsive, and mobile-webview acceptance.
5. Replace remaining active `gDocs` references, then produce the module README reduction and `gDocs` archive/retirement manifest.

No legacy article, `gDocs` file, or module README should be deleted during these steps.

Machine-readable evidence: `manifest/cutover-readiness.json`.
