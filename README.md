# Nodics Documentation Content Pack

`nodicsdocs` is the reusable, source-controlled documentation dataset for
Nodics. It produces standard CMS core-import records that can be installed into
a Nodics project and rendered by Nodics Axis, Nodicsweb, or another compatible
client.

The repository contains no CMS runtime, authentication, business logic, or
frontend renderer. Nodics remains authoritative for schemas and import/delivery
contracts.

## Local migration

The initial migration reads current `gDocs` pages and module-level README files
from a Nodics checkout and converts them to structured article sources:

```bash
npm run migrate -- --nodics-root ../nodics
```

This operation is deliberately separate from normal generation. After the
cutover, maintain `source/articles` rather than editing the legacy Markdown
copies.

## Build a target-specific import pack

CMS pages are associated with Sites. Supply the Site codes belonging to the
target Nodics deployment:

```bash
npm run build -- --sites axisCmsSite
npm run build -- --sites axisCmsSite,nodicsWebCmsSite
```

The generated standard import data is written beneath `data/core`. The build
does not contact a server and does not import automatically.

## Validate

```bash
npm run verify
```

Validation is offline and checks source structure, stable identities, unsafe
content, media references, generated relationships, target Sites, and
compatibility metadata.

## Import

1. Pin a tagged `nodicsdocs` version.
2. Verify the release checksum and compatibility manifest.
3. Build the pack for the target Site codes.
4. Make the generated `data/core` directory available to the existing Nodics
   import process.
5. Create a disposable local-import staging directory with
   `npm run stage:local`.
6. Authenticate to Nodics and explicitly trigger the governed import against
   the printed staging path.
7. Review created, updated, skipped, retired, and failed records.

The browser must never clone this repository or execute its scripts. A future
Axis installation screen may request a backend-owned import operation and
display its progress.

For a trusted local checkout, an employee with `import.local.run` may invoke
the existing Nodics local-import route:

```bash
npm run build -- --sites axisCmsSite --access AUTHENTICATED
npm run stage:local

curl --request POST http://localhost:3000/nodics/system/v0/import/local \
  --header 'Authorization: Bearer <employee-access-token>' \
  --header 'Content-Type: application/json' \
  --header 'x-enterprise-code: default' \
  --data '{
    "inputPath": {
      "rootPath": "/absolute/path/to/nodicsdocs/.work/local-import"
    },
    "importFinalizeData": true
  }'
```

The Nodics importer moves processed files into success/failure directories, so
never point it at source-controlled `data/core`. The staging command preserves
the generated authority and creates a disposable, ignored copy. The path must
exist on the Nodics server. Do not expose arbitrary filesystem paths in an Axis
form. A future installer must select a configured, allowlisted content-pack
source and reuse the same local/remote import lifecycle.
