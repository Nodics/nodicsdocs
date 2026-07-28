# Nodics Documentation Content-Pack Contract

## Ownership

This repository owns the source-controlled Nodics documentation content pack.
Nodics owns CMS schemas, import behavior, authorization, delivery, publishing,
storage, and runtime contracts. Axis and Nodicsweb own their renderers.

Do not add backend business logic, frontend implementations, credentials,
environment URLs, Git operations, or another import engine here.

## Source and generated data

- `source/pages` is the canonical authored documentation authority.
- `source/articles` is the immutable legacy-derived migration snapshot until
  canonical cutover. Do not hand-edit it or treat its flat repository-shaped
  routes as the target information architecture.
- `assets/images` owns reviewed documentation media originals.
- `data/core` is deterministic, committed Nodics import data and the directly
  consumable release artifact.
- Project and application documentation packs standardize their release
  manifest as `manifest/docs-content-pack.json`; do not introduce the longer
  `documentation-content-pack.json` name or a project-specific alternative.
- The CMS database is a runtime projection, never the only content source.
- Never manually maintain the same article in Markdown and structured source.
- Keep concise repository setup guidance in this README only.

## Information architecture

- Organize public documentation by Nodics capability and user outcome, never by
  repository folder or implementation module name.
- Module names are implementation ownership metadata and technical-reference
  destinations. They must not define the primary documentation navigation.
- Every major capability is a hub with separately navigable overview, business
  value, concepts and architecture, runtime behavior, configuration and
  customization, tutorial, operations and security, and technical-reference
  pages where applicable.
- Keep business solutions separate from platform capabilities. A solution page
  composes implemented capabilities and must state implementation status and
  limitations rather than presenting planned behavior as available.
- Navigation order is explicit governed data. Never derive the learning journey
  from filenames, alphabetical order, module discovery order, or import order.
- WordPress, `gDocs`, root documentation, module READMEs, and retired module
  documents are migration evidence. They are not parallel authorities after a
  canonical article is approved. A module keeps one concise `README.md`; do not
  recreate a module `docs/` directory.
- Every module and project still retains a concise high-level `README.md` as
  its local entry point. Migration may retire duplicated detailed guides, but
  never remove that README; it must retain purpose, ownership, major
  capabilities, setup and verification entry points, extension boundaries,
  and links to canonical documentation.
- Retired specialized module documents remain immutable under
  `source/articles` with their migration register disposition and canonical
  destination. Migration refresh must preserve those snapshots after their
  former module paths are removed.
- Every external-provider capability must document provider-neutral
  ownership, prebuilt providers and maturity, selection, building a provider,
  lifecycle and resilience, import and export interaction,
  cross-capability assessment, and operations and verification. This applies to database,
  cache, search, messaging, AI, storage, identity, notification, and payment
  integrations. Record why an inapplicable section does not apply.
- Complex process pages should include small declarative diagrams when they
  materially improve comprehension. Use them for pipelines, workflows,
  import/export, publishing, authentication, provider routing, event delivery,
  and runtime startup sequences that contain three or more dependent steps.
  Pair every diagram with beginner-friendly prose and do not use diagrams to
  present planned behavior as implemented.
- Every implemented capability family must contain one canonical
  **Customize and extend safely** section. It identifies the supported
  project-owned later layer, prohibited framework edits or parallel
  authorities, focused verification, and rollback or removal behavior.
  Related overview and reference pages link to that family authority instead
  of duplicating customization instructions.

## Platform-contract conformance

The platform-wide documentation-impact, detail-preservation, audience,
use-case, and generation principles are owned by Nodics at
`gSetup/llm/contracts/documentation-impact-contract.md`. This repository does
not redefine those developer and AI-tool rules.

This repository applies the Nodics contract to canonical structured content.
Canonical pages carry stable codes and routes, explicit navigation, audiences,
learning depth, provenance, ownership, verification context, and safe
structured blocks. Supported blocks are headings, images, paragraphs, ordered
and unordered lists, blockquotes, code, and tables. Navigation, previous/next
relationships, and migration dispositions are explicit data, never inferred
from filenames or module order.

Every migration source receives a retain, merge, rewrite, archive, or reject
decision. Retain, merge, and rewrite decisions preserve unique verified
examples, configuration, extension, security, operations, failure,
troubleshooting, and verification guidance. No source is retired without a
recorded disposition and destination or reason.

## Safety and compatibility

- Content is declarative and non-executable.
- Raw HTML, scripts, event handlers, embedded credentials, and absolute local
  file paths are forbidden.
- Sites are supplied at build time. Never hardcode Axis, Nodicsweb, tenant, or
  environment identities into reusable source content.
- Stable codes derive from stable source identities, not mutable headings.
- Every generated record carries a source hash and pack version.
- `package.json` is the single content-pack release-version authority. The
  generator projects it into records and the generated manifest; never add a
  second release-version setting to compatibility or runtime configuration.
- Import remains explicit and must use Nodics-owned import contracts.
- Consumers must not install dependencies, run generation, create `.work`
  staging, or call the path-based local-import API. Nodics validates the
  committed release and owns any temporary staging required by nImport.

## Verification

Contributors run `npm run verify` after content, generator, media, or contract
changes. Consumer installation requires no repository command.
Validate duplicate codes, routes, unsupported blocks, broken source links,
missing assets, compatibility metadata, and deterministic generation.
`npm run audit:customization` also rejects any implemented capability family
that has no safe customization authority, prohibited-path guidance,
verification evidence, or rollback behavior.

Before generating a release from reconciled legacy evidence, run
`npm run sync:gdocs-detail` and `npm run normalize:links`. `npm run verify`
enforces both `audit:coverage` and `audit:depth`. Passing a word-count benchmark
does not waive source coverage, factual verification, audience coverage, or
editorial review.
