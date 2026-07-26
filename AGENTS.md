# Nodics Documentation Content-Pack Contract

## Ownership

This repository owns the source-controlled Nodics documentation content pack.
Nodics owns CMS schemas, import behavior, authorization, delivery, publishing,
storage, and runtime contracts. Axis and Nodicsweb own their renderers.

Do not add backend business logic, frontend implementations, credentials,
environment URLs, Git operations, or another import engine here.

## Source and generated data

- `source/articles` is the authored documentation authority after migration.
- `assets/images` owns reviewed documentation media originals.
- `data/core` is deterministic, committed Nodics import data and the directly
  consumable release artifact.
- The CMS database is a runtime projection, never the only content source.
- Never manually maintain the same article in Markdown and structured source.
- Keep concise repository setup guidance in this README only.

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
