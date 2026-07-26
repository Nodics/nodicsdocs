# Nodics Documentation Content Pack

`nodicsdocs` is the reusable, source-controlled documentation dataset for
Nodics. Every published revision already contains standard CMS core-import
records under `data/core`; consumers import those committed records directly
through Nodics without installing dependencies, generating files, building a
pack, or creating a local staging directory.

The repository contains no CMS runtime, authentication, business logic, or
frontend renderer. Nodics remains authoritative for schemas and import/delivery
contracts.

## Install the published content pack

Place the repositories beside each other:

```text
nodicsRoot/
├── nodics/
├── nodicsaxis/
└── nodicsdocs/
```

Enable the configured `nodicsDocumentation` content pack in a later Nodics
project or environment `properties.js`, start Nodics, authenticate as an
authorized employee, and invoke:

```bash
curl --request POST \
  http://localhost:3000/nodics/system/v0/content-packs/nodicsDocumentation/imports \
  --header 'Authorization: Bearer <employee-access-token>' \
  --header 'x-enterprise-code: default'
```

No request body or filesystem path is accepted. Nodics locates the configured
release, validates `manifest/generated-content-pack.json`, copies the committed
`data/core` records into server-owned temporary staging, and dispatches them
through the existing nImport lifecycle. Axis uses this same endpoint when an
authorized administrator selects **Import documentation** or **Update
documentation**.

The consumer must not run repository scripts or point `/import/local` at this
checkout. The normal local importer moves processed files; only the governed
content-pack service may create its disposable server-owned copy.

## Contributor and release maintenance

Normal consumers can stop reading here. The commands below are only for
documentation maintainers preparing a new immutable release.

### Migrate legacy documentation

The initial migration reads current `gDocs` pages and module-level README files
from a Nodics checkout and converts them to structured article sources:

```bash
npm run migrate -- --nodics-root ../nodics
```

This operation is deliberately separate from normal generation. After the
cutover, maintain `source/articles` rather than editing the legacy Markdown
copies.

### Generate a release

CMS pages are associated with Sites. A maintainer generates the committed
release data for the approved Site and access-mode profile:

```bash
npm run generate -- --sites axisCmsSite --access AUTHENTICATED
```

Generation writes standard import data beneath `data/core`. The maintainer must
review and commit the generated data and updated immutable release manifest.
Generation never contacts a server or imports automatically.

### Validate a release

```bash
npm run verify
```

Validation is offline and checks source structure, stable identities, unsafe
content, media references, generated relationships, target Sites, and
compatibility metadata.

Release verification is a maintainer gate. Consumers receive the already
verified, directly importable `data/core` artifact.
