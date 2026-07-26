# Documentation Content Contract

`source/pages` contains canonical authored pages. `source/articles` is the
legacy-derived migration snapshot retained during the controlled transition.
The published content pack continues using its last verified release until the
canonical page graph reaches approved coverage and passes cutover validation.

Each source article contains a stable code, canonical route, navigation
classification, source provenance, content hash, headings, safe content blocks,
links, and media references.

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

During migration, resolvable relative Markdown links are converted to canonical
`/docs/...` routes. Verification rejects missing target routes, missing heading
anchors, relative links that escaped canonicalization, and unsafe schemes.
Repository references that are not documentation pages remain provenance
metadata and are rendered as text rather than client navigation. Shared
navigation and previous/next references are generated from the same canonical
article graph.

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

The committed `data/core` directory is the release artifact. Consumers clone or
download a pinned release and import it directly through Nodics'
`nodicsDocumentation` content-pack endpoint. They do not run generation,
create a `.work` copy, or submit an arbitrary path to `/import/local`.
Contributor generation exists only to prepare and validate a future immutable
release before committing its `data/core` projection and manifest.

Generated records retain stable codes. A later valid release therefore creates
new records and updates matching records through Nodics `saveAll` operations
without duplicating existing pages or components. `nodicsdocs` never performs
database reconciliation, deletion, activation, publication or rollback; those
remain Nodics-owned runtime responsibilities.
