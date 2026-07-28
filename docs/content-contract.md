# Documentation Content Contract

`source/pages` contains canonical authored pages and is the only published
documentation source. `source/articles` is a non-published, legacy-derived
migration snapshot retained for traceability during the controlled transition.

Each canonical page contains a stable code, canonical route, explicit
navigation classification, audiences, learning depth, source provenance, and
safe structured content. The generator derives immutable content hashes,
headings, blocks, links, navigation, and previous/next relationships.

Supported block kinds are:

- `heading`
- `image`
- `paragraph`
- `unordered-list`
- `ordered-list`
- `blockquote`
- `code`
- `table`

Every generated documentation page composes a shared declarative navigation
component and one article component. Navigation supplies bounded page metadata
for client-side discovery; articles supply their own headings plus adjacent
article references. Renderers remain owned by the consuming frontend.

Inline Markdown remains presentation text inside a safe block. Renderers must
support links, emphasis, and inline code through an allowlisted parser and must
not execute raw HTML.

Canonical paragraph entries that contain a complete fenced-code block or
Markdown table are converted during generation into `code` or `table` blocks.
They must never reach a frontend as paragraphs containing visible backticks,
pipe delimiters, or separator rows. The rule applies to every article rather
than to a page-specific renderer exception.

Reviewed local images are generated as `image` blocks, never left as Markdown
paragraph text. Each block carries alternative text, an allowlisted PNG or JPEG
data source, MIME type, and verified content hash. Embedding keeps the committed
content pack directly importable without a build step, filesystem URL, frontend
asset copy, or parallel media server. Renderers must reject other data schemes,
apply responsive bounds, preserve aspect ratio, lazy-load images, and expose
alternative text. A future governed CMS media authority may replace the
transport representation without changing the image-block capability.

## Canonical article metadata

An approved article must identify:

- stable article code and canonical route;
- page family and capability or business-solution owner;
- primary and secondary audiences;
- reader intent, prior knowledge, and learning depth;
- implementation status and applicable version or context;
- documentation owner and last verified date;
- source evidence and owning Nodics modules;
- parent, ordered siblings, previous, next, and related pages;
- migration sources and their retain, merge, rewrite, archive, or reject
  decisions.

Module paths are evidence and ownership metadata. They are not public
information architecture.

Navigation sequence is explicit data. Generators must not infer the learning
journey from routes, filenames, alphabetical sorting, module order, or import
order.

Provider-capable documentation must conform to
`docs/provider-documentation-standard.md`. Provider maturity is evidence-based;
deterministic tests alone cannot establish production qualification.

Every implemented capability family contains one canonical
`Customize and extend safely` section. That family authority must identify the
supported project-owned later layer, preserve the owning runtime contract,
reject framework edits and parallel authorities, name focused verification,
and explain rollback or removal. Overview and reference pages may link to this
authority rather than repeat instructions that could drift.

During migration, resolvable relative Markdown links are converted to canonical
`/docs/...` routes. Verification rejects missing target routes, missing heading
anchors, relative links that escaped canonicalization, and unsafe schemes.
Repository references that are not documentation pages remain provenance
metadata and are rendered as text rather than client navigation. Shared
navigation and previous/next references are generated from the same canonical
article graph.

## Nodics principle conformance

The platform-wide documentation-impact, detail-preservation, audience,
use-case, and generation rules are authoritative in
`nodics/gSetup/llm/contracts/documentation-impact-contract.md`.
`nodicsdocs` implements those rules through structured page metadata, reviewed
migration decisions, source attribution, depth and coverage validation,
canonical-link normalization, deterministic generation, and immutable release
metadata.

This content-pack contract adds no competing product-development principle.
Its responsibility is to ensure that canonical content and generated CMS
records faithfully preserve the Nodics-owned documentation contract.

The reusable renderer keys are:

- page: `documentation.page.article`
- template: `documentation.template.article`
- component: `documentation.component.article`

Axis and Nodicsweb map these keys to client-owned implementations. The content
pack never supplies executable renderer code.

Site routes are generated for every Site supplied to the build. Public versus
authenticated access is selected by the consuming deployment when it builds
the pack; it is not inferred from the client name.

## Release and update contract

`manifest/generated-content-pack.json` identifies an immutable pack version,
content contract version, per-file SHA-256 hashes and one aggregate release
checksum. A release version must change whenever any generated file changes.
Nodics rejects same-version content mutation and, by default, version
downgrades.

The standard `package.json` version is the single source for the content-pack
release version. Contributor generation projects that value into every
generated record and `manifest/generated-content-pack.json`;
`compatibility.json` owns only Nodics and content-contract compatibility. Do
not introduce another manually maintained release-version field.

The committed `data/core` directory is the release artifact. Consumers clone or
download a pinned release and import it directly through Nodics'
`nodicsDocumentation` content-pack endpoint. They do not run generation,
create a `.work` copy, or submit an arbitrary path to `/import/local`.
Contributor generation exists only to prepare and validate a future immutable
release before committing its `data/core` projection and manifest.

Generated records retain stable codes. A later valid release therefore creates
new records and updates matching records through Nodics `saveAll` operations
without duplicating existing pages or components.

When a canonical page is intentionally retired, its stable identity, title,
and route must first be added to `source/retired-pages.json`. The generator
emits inactive component, page, and route tombstones through the same `saveAll`
contract. This prevents a retired route from remaining active without creating
a second deletion mechanism. A code or route cannot be both canonical and
retired.

Version 0.3 does not claim physical deletion or atomic catalog activation.
Database reconciliation, physical deletion, staged-to-online publication, and
rollback remain Nodics-owned runtime responsibilities governed by CMS
versioning, Workflow, and nPublish.
