# Documentation Migration and Retirement Policy

## Authorities

- Nodics source, configuration, schemas, APIs, contracts, tests, and verified
  runtime behavior are authoritative for product behavior.
- `nodicsdocs` is authoritative for published human documentation content,
  navigation, media, and migration provenance.
- Module READMEs provide concise technical orientation and link to canonical
  capability documentation.
- WordPress, `gDocs`, root documentation, module READMEs, and module documents
  are migration evidence until reconciled. They must not remain competing
  published authorities.

## Migration decisions

Every discovered page or meaningful section receives one recorded decision:

- **retain**: it already fits one canonical destination with minor correction;
- **merge**: its unique information joins another canonical article;
- **rewrite**: the subject is useful but structure, language, or accuracy needs
  substantial work;
- **archive**: it is historically useful but not current product guidance;
- **reject**: it is duplicated, unsafe, incorrect, or irrelevant.

No source disappears without a recorded disposition and destination or reason.

A `merge`, `rewrite`, or `retain` decision preserves all unique verified
instructional knowledge. The destination may reorganize the source into
capability-first language, split it into clearer sections, replace obsolete
links, and add stronger explanation. It may not discard substantive headings,
examples, tables, configuration choices, extension guidance, security,
operations, failure behavior, troubleshooting, or verification merely because
the new page already meets a size benchmark.

`source/migration-decisions.json` is the individual reviewed decision
authority. `source/migration-rules.json` contains reviewed ownership mappings
for unambiguous package families; explicit decisions override those rules.
`manifest/migration-register.json` is a deterministic inventory that combines
those decisions with current Nodics and WordPress evidence. Capability
suggestions in that register are discovery aids only; they never publish,
rewrite, archive, or reject content automatically.

## Required verification

Before a canonical article is approved:

1. verify claims against current source and focused tests;
2. identify implemented, conditional, deprecated, and planned behavior;
3. reconcile conflicting source documents;
4. verify examples, links, media, terminology, and navigation;
5. verify business, beginner, developer, security, and operator coverage where
   applicable;
6. record ownership and last verification evidence.
7. run deterministic evidence synchronization when applicable;
8. normalize legacy links to canonical routes;
9. pass source citation, heading, and detailed-content coverage;
10. pass page-family depth validation without treating that lower bound as a
    substitute for editorial review.

`npm run sync:gdocs-detail` replaces only sections attributed to the same
`migratedFrom` evidence identifier and therefore remains idempotent.
`npm run normalize:links` translates reviewed legacy documentation routes into
canonical routes. `npm run audit:coverage` rejects mapped instructional sources
whose citation, headings, or detailed content were lost. `npm run audit:depth`
rejects pages below the page-family lower bound.

## `gDocs` retirement

`gDocs` is frozen for new public documentation once canonical migration begins.
It remains in place while migration and validation are incomplete.

After a completeness report proves that no unique authoritative content remains:

1. remove `gDocs` from active navigation, imports, generated context, and
   documentation links;
2. preserve its final state in Git history;
3. move a temporary working copy to the untracked, non-runtime root
   `docs/archive/gDocs` workspace;
4. mark that copy historical and non-authoritative;
5. retain it for an agreed stabilization period;
6. delete the temporary archive only through separate explicit approval.

Moving the copy does not transfer authority to root `docs/`.

## Module README target

After migration, a module README contains only:

- responsibility, boundary, and non-responsibilities;
- dependencies and runtime participation;
- owned schemas, APIs, configuration, providers, and extension points;
- focused setup, development, and verification commands;
- links to canonical capability and reference documentation.

It does not duplicate business guides, beginner journeys, long tutorials, or
cross-platform architecture.

## Change governance

Every implementation change declares documentation impact:

- no documentation impact, with a reason;
- revise an existing canonical article;
- revise a tutorial, example, or reference;
- add a canonical article only when no authority exists.

Implementation is incomplete while affected documentation, examples,
contracts, generated content, or verification evidence is stale.

The documentation impact review must also identify whether the change affects:

- business capability or decision guidance;
- beginner or business-user workflows;
- schema, API, event, import/export, or other data contracts;
- configuration, defaults, precedence, or runtime activation;
- authentication, authorization, tenancy, ownership, privacy, or audit;
- customization and provider-extension guidance;
- performance, capacity, observability, deployment, recovery, or rollback;
- examples, troubleshooting, compatibility, maturity, or limitations.

Update every affected canonical destination. Do not create a new page when an
existing authority can be extended safely.
