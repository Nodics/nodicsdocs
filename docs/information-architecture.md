# Nodics Documentation Information Architecture

## Purpose

Nodics documentation teaches people what the platform enables before exposing
the modules that implement it. The primary journey moves from framework
understanding to capabilities, business solutions, implementation, operation,
and reference.

Repository folders and module names are not customer navigation.
`gFramework/nConfig`, for example, is technical ownership evidence for the
public capability named **Nodics Configuration Layer**.

## Primary navigation

The governed top-level sequence is:

1. Discover Nodics
2. Evaluate Nodics
3. Get Started
4. Platform Capabilities
5. Business Solutions
6. Build and Extend
7. Secure and Govern
8. Deploy and Operate
9. Reference

Discover contains both **What Is Nodics?** and **How the Nodics Framework Is
Organized**. The architecture page explains the platform mental model; it does
not own the Platform Capabilities navigation subtree.

Contributor and AI-tool guidance is reachable from Build and Extend and
Reference without interrupting the beginner or business journey.

## Platform-capability sequence

Capabilities follow conceptual dependencies rather than module or alphabetical
order:

1. Configuration and runtime governance
2. Modular and layered architecture
3. Schema and item modeling
4. Validation and policy enforcement
5. Search models and querying
6. Database and persistence
7. Services and facades
8. Controllers, routers, and APIs
9. Pipelines, interceptors, and processes
10. Libraries and utilities
11. Status codes and error handling
12. Authentication and authorization
13. Tenants, enterprises, and ownership
14. Caching
15. Search and indexing
16. Events and messaging
17. Scheduled jobs
18. Workflows and business processes
19. Import and export
20. Content management and publishing
21. Commerce capabilities
22. Observability and operational governance
23. AI providers, knowledge, and assistants

Only implemented and verified capabilities are published as available.
Unimplemented design remains outside the public content pack.

## Capability hub

A major capability uses separately navigable pages where applicable:

1. Overview
2. Business Value and Decisions
3. Concepts and Architecture
4. Runtime Behavior
5. Configuration and Customization
6. Tutorial and Real Example
7. Operations, Security, and Troubleshooting
8. Technical Reference

The hub may omit an inapplicable child only when its metadata records why.
Pages must not combine executive evaluation, beginner education, operating
procedure, and exhaustive technical reference into one undifferentiated
article.

## Business solutions

Business solutions compose capabilities to solve recognizable problems:

- Data as a Service;
- centralized data management and Product Information Management;
- Web Content Management and dynamic websites;
- modular commerce;
- multi-tenant SaaS platforms;
- workflow and business automation;
- event-driven integration;
- AI-enabled knowledge and operations.

Each solution explains the problem, personas, outcomes, end-to-end scenario,
composed capabilities, adoption path, security and operational concerns,
implementation status, limitations, and supporting evidence.

## Audience and depth

Navigation supports three independent dimensions:

- audience: evaluator, business user, administrator, developer, architect,
  security reviewer, operator, framework maintainer, or AI tool;
- task: understand, decide, install, configure, build, extend, operate,
  troubleshoot, or reference;
- depth: overview, guided practice, implementation detail, or exhaustive
  reference.

Every article has one primary intent. Cross-links let readers change audience,
task, or depth without duplicating content.

## Content-depth contract

Page segregation does not justify thin content. A page is complete only when a
reader can achieve its declared intent without already knowing the repository
or guessing the missing business context.

Every overview page must explain:

1. what the topic means in plain language before using specialist terms;
2. a familiar analogy;
3. why an application or organization needs it;
4. a small end-to-end example;
5. the main terminology and how the concepts relate;
6. what Nodics provides;
7. the business problem and recognizable outcomes;
8. capability ownership and important authority boundaries;
9. configuration and supported customization;
10. security, tenant, operational, failure, and scale implications;
11. what is implemented, material limitations, and the next learning paths.

The first section of every overview is therefore a question beginning with
**What is** or **What are**. It must be understandable by a graduate or business
reader who has not previously used the technology.

Every business-value page must explain the affected personas, current pain,
measurable outcomes, decision criteria, adoption trade-offs, risks, and a
representative scenario. It must not rely on unsupported marketing claims.

Every concepts, architecture, or runtime page must explain the mental model,
participants, ownership, lifecycle or request flow, configuration inputs,
failure behavior, extension boundaries, and a worked example.

Every configuration or customization page must identify the authoritative
property owner, defaults, supported layers, precedence, safe customization
path, validation, security considerations, reload or restart behavior, and an
example. It must warn against constants and parallel configuration paths that
make later project modules difficult to extend.

Every tutorial must state the goal, prerequisites, starting state, ordered
steps, expected result, positive verification, negative verification, cleanup
or rollback, common failures, and where production behavior differs from the
example.

Every operations and security page must cover health signals, logs and
diagnostics, permissions, secrets, failure modes, recovery, performance,
capacity, audit evidence, and escalation or rollback where applicable.

Every technical-reference page must be useful as a lookup surface. It records
the public contracts, configuration namespaces, schemas, APIs, services,
events, status or error behavior, extension points, compatibility constraints,
and source evidence applicable to its subject. A short list of module names is
not technical reference.

Content depth is evidence-led, not word-count padding. Root documentation,
implemented source contracts, tests, module READMEs, and verified operational
behavior are evidence. Planned behavior remains in temporary planning material
until implementation is verified. When evidence is incomplete, the page states
the limitation rather than inventing detail.

## Source-preservation contract

Reorganizing documentation must never silently compress a complete guide into a
short overview. Capability-first navigation changes where knowledge is found;
it does not authorize deletion of beginner explanation, business context,
examples, tables, configuration choices, extension guidance, failure behavior,
security detail, operational procedures, or troubleshooting.

Every migrated user-facing source has an explicit disposition and destination.
For a source marked `merge`, `rewrite`, or `retain`, the canonical destination
must:

1. cite the source evidence identifier;
2. retain every substantive source heading;
3. preserve the instructional detail beneath those headings;
4. keep any stronger new explanation added during restructuring;
5. remove content only when a reviewed migration decision identifies it as
   obsolete, unsafe, duplicated by a named canonical authority, or unsupported
   by the implementation.

`npm run sync:gdocs-detail` deterministically synchronizes the extracted legacy
guides into their reviewed canonical destinations. It is idempotent: previously
synchronized sections are replaced from the same evidence source instead of
being duplicated. `npm run audit:coverage` then checks citation, heading, and
detail preservation. This coverage gate complements the page-depth audit; a
page can be long enough and still fail when it has lost source knowledge.

Module READMEs and module technical documents remain implementation evidence
while they contain module-owned contracts. They are not promoted wholesale into
customer navigation. A later cutover may reduce a module README to concise
technical ownership, setup, extension, and verification guidance only after
the source-coverage register proves that all user-facing knowledge has a
canonical home.

## Naming

- Use capability and outcome names in titles and navigation.
- Expand unfamiliar terminology on first use.
- Put module names, paths, classes, schemas, properties, and source references
  in technical detail and evidence metadata.
- Preserve stable canonical routes when a title changes.
- Avoid unverified marketing comparisons and unsupported capability claims.

## Navigation behavior

Learning order is stored explicitly. Every published article declares a parent
and order within that parent. Previous and next links derive from that governed
order. Related links express conceptual relationships and never replace the
primary sequence.

Search indexes titles, summaries, terminology, business problems, tasks,
capabilities, and technical aliases so a reader can find **Nodics
Configuration Layer** by searching for `nConfig` without seeing the module name
as the page identity.
