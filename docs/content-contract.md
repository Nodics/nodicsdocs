# Documentation Content Contract

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

Inline Markdown remains presentation text inside a safe block. Renderers must
support links, emphasis, and inline code through an allowlisted parser and must
not execute raw HTML.

The reusable renderer keys are:

- page: `documentation.page.article`
- template: `documentation.template.article`
- component: `documentation.component.article`

Axis and Nodicsweb map these keys to client-owned implementations. The content
pack never supplies executable renderer code.

Site routes are generated for every Site supplied to the build. Public versus
authenticated access is selected by the consuming deployment when it builds
the pack; it is not inferred from the client name.
