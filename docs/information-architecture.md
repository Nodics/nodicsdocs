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
4. Learn the Framework
5. Platform Capabilities
6. Business Solutions
7. Build and Extend
8. Secure and Govern
9. Deploy and Operate
10. Reference

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
