# Contributing to Nordhold Wiki

Thank you for contributing to Nordhold Wiki.

This repository uses GitHub Spec Kit, Spec-Driven Development, Conventional
Commits, and pull-request-based development. All persistent repository artifacts,
branch names, commits, and pull requests MUST be written in English.

## Development Model

`main` is the integration and delivery branch. Changes MUST NOT be committed
directly to `main` after the initial repository bootstrap. Every subsequent
change MUST be developed on a dedicated branch and integrated through a pull
request.

The normal lifecycle is:

`Issue / Requirement -> Branch -> Implementation -> Validation -> Commits -> Draft PR -> Review -> Merge`

AI agents MAY perform this workflow autonomously through creation of the draft
pull request. Merge approval remains a human responsibility.

## Work Types

Before creating a branch, classify the change.

### Feature

Use for new product capabilities, changed expected behavior, new content models,
new external integrations, or material architecture changes.

Features MUST normally follow the Spec Kit feature workflow.

Branch prefix: `feature/<spec-name>`

Example: `feature/initial-wiki-platform`

### Fix

Use only when existing intended behavior is broken. Fixes SHOULD use the Spec Kit
bug workflow.

Branch prefix: `fix/<spec-kit-bug-name>`

Example: `fix/broken-unit-links`

A request that changes intended behavior is NOT a fix and MUST be handled as a
feature or behavioral change.

### Content, Documentation, Refactoring, and Maintenance

Wiki-content corrections, documentation-only changes, internal refactoring, CI,
tooling, and repository configuration use `feature/<spec-name>`. A Spec Kit
feature is optional only when expected product behavior and architecture do not
change.

Examples:

- `feature/correct-tower-costs`
- `feature/document-local-setup`
- `feature/update-ci-tooling`

## Branch Naming

Branch names MUST be written in English, use lowercase kebab-case after the
prefix, describe the purpose, and remain concise.

The supported patterns are:

- `feature/<spec-name>`
- `fix/<spec-kit-bug-name>`

Use `feature/` for features, behavioral changes, content, refactoring,
documentation, tooling, and maintenance. Use `fix/` only for a confirmed bug
handled through the Spec Kit bug workflow. When a Spec Kit artifact exists, the
branch suffix SHOULD match its descriptive slug without the numeric directory
prefix.

Avoid generic names such as `feature/update`, `fix/bug`, `test`, or `work`.

## Conventional Commits

All commits MUST follow the Conventional Commits specification:

`<type>(<optional-scope>): <description>`

Common types:

- `feat` - introduces new product behavior
- `fix` - restores existing intended behavior
- `test` - adds or updates tests without changing production behavior
- `refactor` - restructures code without changing expected behavior
- `docs` - documentation or wiki-content changes
- `chore` - maintenance work
- `ci` - continuous integration changes
- `build` - build-system or dependency-management changes
- `perf` - performance improvements

Examples:

- `feat(wiki): add tower detail pages`
- `feat(search): add static content index`
- `fix(content): correct broken unit references`
- `test(content): validate cross-page identifiers`
- `refactor(webapp): isolate content loader`
- `docs(content): correct resource descriptions`
- `ci: add pull request validation`

Commit descriptions MUST be written in English, use the imperative mood, start
with a lowercase letter unless a proper noun requires otherwise, remain concise,
and describe the meaningful change.

Avoid messages such as `update`, `changes`, `wip`, `fix stuff`, or `more work`.

## Commit Scope

Prefer logically focused commits. A commit SHOULD represent one coherent change.
Do not combine unrelated content rewriting, refactoring, feature development,
and bug fixes in one commit.

Temporary local checkpoint commits MAY be used during development but SHOULD be
cleaned up before review when they provide no useful project history.

## Breaking Changes

Breaking changes MUST be explicitly marked, for example:

`feat(content)!: replace the article schema`

or with a footer:

`BREAKING CHANGE: article JSON now uses schema version 2.`

Breaking changes require explicit review and MUST be supported by an accepted
specification.

## Spec Kit Requirements

### Features

Meaningful features and behavioral changes SHOULD follow:

1. Specify
2. Clarify
3. Plan
4. Checklist when useful
5. Tasks
6. Analyze
7. Implement
8. Converge

The pull request SHOULD reference the corresponding feature directory under
`specs/`.

### Bug Fixes

Fixes SHOULD use the dedicated Spec Kit bug process:

1. Assess
2. Fix
3. Test

The pull request SHOULD reference the corresponding bug directory under
`.specify/bugs/`.

Do NOT create a feature specification merely to repair an implementation that
does not conform to existing intended behavior. If expected behavior itself must
change, reclassify the work as a feature.

## Wiki Content Contributions

Wiki data belongs in version-controlled JSON files under `webapp/` once the
content layout is specified. Content contributions MUST:

- conform to the current JSON schema and formatting rules;
- use stable identifiers and valid internal references;
- distinguish confirmed facts from interpretation;
- include source or verification information when the content model supports it;
- avoid unauthorized copying of game text, artwork, or other protected assets;
- preserve deterministic application builds.

Content generated from another source MUST have a documented, reproducible
generation process. A database, runtime CMS, or server-side persistence layer is
outside project scope unless separately specified and explicitly approved.

## Testing and Validation

Significant application and content-transformation logic MUST include
appropriate unit tests. Bug fixes SHOULD include a regression test where
practical.

Before opening a pull request, run applicable:

- unit and component tests;
- JSON schema and cross-reference validation;
- static analysis, linting, and formatting checks;
- production build validation;
- Terraform formatting, validation, linting, and plan checks.

Do NOT disable tests or weaken assertions merely to obtain a passing build. If a
required validation step cannot be executed, document that fact in the pull
request.

## Dependencies

New, removed, or replaced third-party dependencies require explicit approval.
A dependency proposal SHOULD explain why it is needed, why existing or platform
functionality is insufficient, and its security, maintenance, bundle-size, and
architectural impact.

Do not add a dependency first and request approval afterward.

## AWS and Terraform Changes

Infrastructure changes MAY be prepared as Terraform code. Provisioning,
modifying, or destroying actual AWS resources requires explicit approval.

Infrastructure pull requests SHOULD describe:

- affected AWS services and environments;
- expected security and privacy impact;
- expected operational and cache behavior;
- meaningful cost implications;
- deployment, migration, and rollback considerations;
- Terraform state or bootstrap implications.

Terraform state, plan files, credentials, and real variable values MUST NOT be
committed.

## Pull Requests

All changes to `main` after the initial repository bootstrap MUST go through a
pull request. AI-generated changes MUST initially be opened as a draft pull
request.

A pull request SHOULD be focused on one coherent feature, fix, content update,
or maintenance objective. Its title SHOULD follow Conventional Commit semantics
where practical.

### Pull Request Description

Each pull request MUST contain enough information for review and include the
following sections.

### Summary

Describe what changed and why.

### Spec Kit

For features, reference the relevant `specs/...` directory. For fixes, reference
the relevant `.specify/bugs/...` directory. For content or maintenance work,
state whether product behavior changes.

### Validation

List only commands or checks that were actually executed.

### Tests

Describe tests added or updated.

### Content and Sources

Describe JSON content changes, factual sources, generated data, and licensing or
attribution considerations. Write `None` when applicable.

### Risks

Describe important implementation, compatibility, content, security, or
operational risks.

### Dependencies

List newly added, removed, or changed dependencies. Write `None` when applicable.

### Persistence Changes

State whether any database or runtime persistence is introduced. The normal
answer is `None`.

### AWS Impact

Describe infrastructure impact. Write `None` when applicable.

### Known Limitations

Document unresolved limitations or skipped validation.

## Draft Pull Requests

Agents MAY independently create the working branch, implement an approved task,
run validation, create compliant commits, push the branch, and create a draft
pull request. Agents MUST stop when the draft pull request is ready unless
explicitly instructed otherwise. Agents MUST NOT approve or merge their own pull
requests.

## Git Safety

Contributors and agents MUST NOT:

- commit directly to `main` after the initial bootstrap;
- force-push shared branches without explicit approval;
- rewrite shared Git history;
- delete remote branches without authorization;
- discard another contributor's uncommitted work;
- bypass branch protection;
- merge a pull request without required approval.

## Definition of Ready for Review

A pull request is ready to leave draft status when, as applicable:

- requested behavior or content is complete;
- JSON schemas and internal references validate;
- relevant tests and configured checks pass;
- Spec Kit artifacts are current;
- convergence is complete for feature work;
- bug verification is complete for bug fixes;
- documentation and source information are current;
- dependency and AWS approvals are complete;
- known limitations are documented.

Human review remains required before merge.
