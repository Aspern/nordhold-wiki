# AGENTS.md

## Purpose

This repository contains `nordhold-wiki`, a community knowledge base for the
computer game Nordhold.

The project uses GitHub Spec Kit and follows Spec-Driven Development. It consists
of a static web application and Terraform-managed AWS infrastructure that
publishes the application through Amazon CloudFront. Wiki data is stored in
version-controlled JSON files; the application has no database.

This file defines operational rules for AI coding agents. Human contributors
and agents MUST additionally follow `CONTRIBUTING.md`.

## Language

Agents MAY communicate with the user in German.

All persistent repository artifacts MUST be written in English, including:

- specifications;
- plans;
- tasks;
- checklists;
- bug artifacts;
- wiki data and documentation;
- code comments and identifiers;
- commit messages and branch names;
- pull-request titles and descriptions.

When requirements are supplied in German, agents MUST translate them faithfully
into English before persisting them. The translation MUST preserve the original
intent and MUST NOT introduce additional requirements.

## Instruction Precedence

When instructions conflict, use the following precedence:

1. Explicit user instruction for the current task
2. `.specify/memory/constitution.md`
3. Accepted specification for the active feature
4. Active implementation plan
5. Active task list
6. Active bug assessment for a bug fix
7. `CONTRIBUTING.md`
8. This `AGENTS.md`
9. Existing repository conventions
10. Agent defaults

An implementation MUST NOT silently redefine an accepted requirement. If an
implementation and specification disagree, determine explicitly which artifact
is incorrect. Do NOT modify a specification merely to make existing code appear
compliant.

## Repository Boundaries

The top-level modules have explicit responsibilities:

- `webapp/` owns application source, static JSON content, build tooling, and
  application tests.
- `infra/` owns Terraform configuration, infrastructure tests, and deployment
  documentation.
- `.specify/` and `specs/` own Spec Kit workflows and artifacts.

Do not place application behavior in `infra/` or cloud-resource definitions in
`webapp/`. Shared automation MUST be clearly identified and MUST NOT create
hidden coupling between modules.

## Work Classification

Before changing product behavior, classify the work.

### Feature or Behavioral Change

The following normally require the standard Spec Kit workflow:

- new or changed user-visible behavior;
- new wiki content types or navigation behavior;
- changes to JSON schemas or content interpretation;
- new search, filtering, localization, or accessibility behavior;
- new external integrations;
- new AWS resources or material delivery changes;
- significant architectural changes required by new capabilities.

Use the standard Spec Kit feature workflow.

### Bug Fix

A bug exists when the implementation deviates from already intended behavior.
Bug fixes SHOULD use the installed Spec Kit bug workflow:

1. Assess
2. Fix
3. Test

Bug artifacts belong under `.specify/bugs/<slug>/`.

If investigation shows that the requested result changes intended behavior,
STOP the bug workflow and reclassify the work as a feature or behavioral change.

### Maintenance

Pure documentation, wiki-content corrections, CI, formatting, tooling, or
internal maintenance that does not change expected product behavior does not
require a feature specification unless it introduces significant architectural
consequences.

## Feature Workflow

For significant features and behavioral changes, use:

1. Specify
2. Clarify
3. Plan
4. Checklist when appropriate
5. Tasks
6. Analyze
7. Implement
8. Converge
9. Validate
10. Prepare a draft pull request

Agents MUST NOT bypass a blocking Spec Kit result. If Spec Kit identifies an
unresolved ambiguity, constitutional violation, or other blocking condition
that cannot safely be resolved from repository information, stop and request
user input.

## Bug Workflow

Bug fixes MUST remain separate from feature specifications. The expected flow
is:

1. Assess the defect.
2. Confirm that expected behavior already exists.
3. Identify the root cause.
4. Define a minimal remediation.
5. Implement only the required fix.
6. Add or update a focused regression test where practical.
7. Validate the corrected behavior.
8. Prepare a draft pull request.

Bug fixes SHOULD be minimal and surgical. Do not use a bug fix as an opportunity
for unrelated refactoring, content rewriting, or feature development.

## Agent Autonomy

Agents MAY work autonomously from an approved task through preparation of a
draft pull request. Within approved scope an agent MAY:

- inspect repository contents;
- create an appropriate working branch;
- modify source code, JSON content, and Terraform configuration;
- create and update tests and documentation;
- execute local validation commands;
- create commits and push the working branch;
- prepare a draft pull request.

All Git, commit, branch, and pull-request operations MUST comply with
`CONTRIBUTING.md`. Agents MUST NOT merge their own pull requests.

## Mandatory Human Approval

Agents MUST stop and request explicit approval before:

- adding, removing, or replacing a third-party dependency;
- introducing a database or runtime persistence service;
- performing destructive data operations;
- provisioning, modifying, or destroying AWS resources;
- running infrastructure deployment commands against shared environments;
- changing secrets or credentials;
- amending the project constitution;
- bypassing a Spec Kit quality gate;
- materially expanding accepted feature scope;
- publishing third-party copyrighted assets that are not clearly authorized.

Preparing reviewable source or Terraform changes does not itself provision AWS
resources and is allowed within an approved task.

## Dependencies

Prefer existing dependencies when they reasonably satisfy a requirement. Before
proposing a new third-party dependency, determine:

- what problem it solves;
- whether existing dependencies already solve it;
- whether platform functionality is sufficient;
- its security, maintenance, bundle-size, and architectural impact.

Do NOT install a new dependency before obtaining approval.

## Static Content and Data

Wiki content MUST be stored as version-controlled JSON within `webapp/` and MUST
be usable without a database, server-side application, or runtime CMS.

JSON schemas and validation rules MUST be explicit once content models are
introduced. Content changes MUST preserve schema validity, stable identifiers,
valid internal references, and deterministic builds. Generated JSON MUST have a
documented source and reproducible generation process.

Facts about Nordhold SHOULD be verifiable against a cited source or direct game
observation when practical. Unverified interpretation MUST NOT be presented as
confirmed fact. Content provenance and licensing constraints MUST remain
reviewable.

Do not commit copied game assets, text, or other third-party material unless its
use is authorized and attribution requirements are satisfied. Prefer original
summaries and independently created assets.

## No Database

The project intentionally has no database. Agents MUST NOT introduce database
clients, schemas, migrations, hosted databases, or runtime persistence without a
separate accepted architectural change and explicit human approval.

User-specific or mutable server-side data is outside the initial project scope.

## AWS and Terraform

AWS is the target cloud platform. The application MUST be published through
Amazon CloudFront. Supporting AWS services MUST be limited to what accepted
requirements justify.

AWS infrastructure MUST be defined and managed as code with Terraform. Service
selection and architecture decisions MUST consider:

- security and least privilege;
- reliability and recoverability;
- maintainability and operational complexity;
- expected cost;
- static-site delivery and cache behavior.

Terraform state, environment separation, bootstrapping, deployment, and rollback
MUST be documented before shared infrastructure is applied. Secrets and account-
specific values MUST NOT be committed.

Agents MAY prepare Terraform changes within an approved task. Agents MUST NOT
provision, modify, or destroy AWS resources without explicit approval.

## Testing

Significant application logic and content transformation logic MUST have
automated unit tests. This includes, where applicable:

- JSON schema and cross-reference validation;
- content indexing, search, and filtering;
- navigation and route generation;
- data normalization and sorting;
- infrastructure policy and configuration checks.

Bug fixes SHOULD include focused regression coverage where practical. Tests MUST
verify meaningful behavior. Agents MUST NOT delete valid tests, weaken
assertions to hide regressions, or claim tests passed when they were not run.

### CI Cost Discipline

Routine CI MUST favor fast unit, component, content-validation, and Terraform
static checks. Tests SHOULD use local fixtures and MUST NOT require deployed AWS
resources or external network access unless an accepted requirement explicitly
requires it.

Browser end-to-end tests, live AWS integration tests, and manual acceptance or
performance checks MUST NOT run in routine CI unless an accepted requirement
makes them necessary and their expected CI cost has explicit human approval.

Module workflows SHOULD install dependencies once and combine compatible fast
quality gates in one job when practical. Infrastructure planning SHOULD run only
when infrastructure code or its shared automation is affected.

## Security and Privacy

Never commit API keys, access tokens, passwords, credentials, private keys,
Terraform state, or real environment secrets.

JSON content and route parameters MUST be treated as untrusted input until
validated. Rendered content MUST not permit script injection. Security controls
MUST NOT be disabled merely to simplify development. AWS permissions MUST follow
least privilege, and the static origin SHOULD not be publicly writable.

Do not collect personal data or add analytics, tracking, authentication, or user
accounts unless introduced through a separate accepted specification.

## Architecture

The frontend technology stack is intentionally open at this stage. Prefer:

- a static build with no runtime application server;
- simple, cohesive modules and explicit responsibilities;
- accessible, responsive, progressively enhanced interfaces;
- deterministic builds and testable content logic;
- clear boundaries between content, presentation, and infrastructure.

Avoid speculative abstractions, unnecessary frameworks or services, premature
optimization, and a backend introduced only for convenience.

Significant architectural decisions MUST be documented in the relevant Spec Kit
plan.

## Scope Discipline

Keep changes focused on the active feature, bug, or maintenance task. Do not
refactor unrelated code, rewrite unrelated wiki content, rename unrelated APIs,
introduce speculative infrastructure, or silently expand scope. Report unrelated
issues separately.

## Completion

Code generation alone does not constitute completion. Before preparing a draft
pull request, verify as applicable:

- accepted behavior is implemented;
- JSON content and internal references are valid;
- relevant tests exist and pass;
- configured static, formatting, and Terraform checks pass;
- documentation is current;
- no unapproved dependency, persistence service, or AWS mutation was introduced;
- Spec Kit artifacts accurately represent the work;
- the implementation complies with the constitution and `CONTRIBUTING.md`.

Feature work SHOULD complete Spec Kit convergence before review. Bug fixes
SHOULD complete the Spec Kit bug-test step before review. If validation remains
incomplete, state this explicitly in the draft pull request.
