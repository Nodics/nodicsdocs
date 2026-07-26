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
- WordPress, `gDocs`, root documentation, module READMEs, and module documents
  are migration evidence. They are not parallel authorities after a canonical
  article is approved.
- Follow `docs/information-architecture.md` and
  `docs/migration-and-retirement-policy.md` for all migration work.
- Every external-provider capability must follow
  `docs/provider-documentation-standard.md`. Document provider-neutral
  ownership, prebuilt adapters and maturity, selection, how to add a provider,
  lifecycle, import/export and cross-capability interaction, operations, and
  verification. Record why an inapplicable section does not apply.

## Safety and compatibility

- Content is declarative and non-executable.
- Raw HTML, scripts, event handlers, embedded credentials, and absolute local
  file paths are forbidden.
- Sites are supplied at build time. Never hardcode Axis, Nodicsweb, tenant, or
  environment identities into reusable source content.
- Stable codes derive from stable source identities, not mutable headings.
- Every generated record carries a source hash and pack version.
- Import remains explicit and must use Nodics-owned import contracts.
- Consumers must not install dependencies, run generation, create `.work`
  staging, or call the path-based local-import API. Nodics validates the
  committed release and owns any temporary staging required by nImport.

## Verification

Contributors run `npm run verify` after content, generator, media, or contract
changes. Consumer installation requires no repository command.
Validate duplicate codes, routes, unsupported blocks, broken source links,
missing assets, compatibility metadata, and deterministic generation.
