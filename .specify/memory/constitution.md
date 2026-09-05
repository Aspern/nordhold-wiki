<!--
Sync Impact Report

- Version change: template -> 1.0.0
- Added principles:
  - Specification-Driven Scope Fidelity
  - Static Content Integrity
  - Testable and Accessible Experience
  - Secure Static Delivery
  - Simplicity and Explicit Change Control
- Added sections:
  - Operational Constraints
  - Development Workflow and Quality Gates
- Removed sections: None
- Follow-up TODOs: None
-->

# Nordhold Wiki Constitution

## Core Principles

### I. Specification-Driven Scope Fidelity

Every change MUST be classified as a feature or behavioral change, bug fix, or
maintenance before product behavior is modified. Features and behavioral
changes MUST follow the Spec Kit feature workflow. Bug fixes MUST remain
separate from feature specifications and MUST restore already intended
behavior. Maintenance work MAY proceed without a feature specification only
when it does not change expected product behavior or introduce significant
architectural consequences.

Implementations MUST conform to accepted requirements. An implementation MUST
NOT silently redefine a specification, and a specification MUST NOT be changed
merely to make existing code appear compliant. When artifacts conflict, the
incorrect artifact MUST be identified and corrected according to the project's
instruction precedence.

Rationale: Explicit classification and traceable requirements prevent scope
drift and keep implementation decisions reviewable.

### II. Static Content Integrity

Wiki content MUST be stored in version-controlled JSON files and shipped as part
of the static web application. The application MUST NOT require a database,
server-side application, or runtime content-management service. Introducing
runtime persistence requires a separate accepted architectural change and
explicit human approval.

Once content models exist, their JSON schemas, stable identifiers, and reference
rules MUST be explicit and automatically validated. Builds MUST be deterministic.
Generated content MUST have a documented source and reproducible generation
process.

Nordhold facts SHOULD be verifiable through a cited source or direct game
observation when practical. Interpretation MUST be distinguished from confirmed
fact. Unauthorized copies of game text, artwork, or other protected assets MUST
NOT be published; original summaries and independently created assets are
preferred.

Rationale: A static wiki remains reliable only when its content is structured,
traceable, legally reviewable, and reproducible without hidden state.

### III. Testable and Accessible Experience

Significant application logic and content transformation logic MUST have
automated tests that verify meaningful behavior. This includes JSON validation,
cross-reference resolution, route generation, search, filtering, normalization,
and sorting where applicable.

Bug fixes SHOULD include focused regression coverage whenever practical. Valid
tests MUST NOT be deleted, disabled, or weakened merely to make an
implementation pass. Test results MUST be reported truthfully, including any
validation that could not be executed.

User-facing features MUST account for keyboard access, semantic structure,
readable contrast, responsive layouts, and assistive technologies. Accessibility
requirements and validation MUST be made concrete in the relevant specification
and plan.

Rationale: Automated evidence protects data integrity while accessibility makes
the knowledge base useful to the broadest practical audience.

### IV. Secure Static Delivery

The application MUST be built as static assets and published through Amazon
CloudFront. Supporting AWS services MUST be limited to what accepted
requirements justify. AWS infrastructure MUST be defined and managed through
Terraform.

Cloud access MUST follow least privilege. Secrets, credentials, tokens, private
keys, Terraform state, and real environment values MUST NOT be committed.
Rendered content and route parameters MUST be treated as untrusted until
validated and MUST NOT permit script injection.

Terraform state, environment separation, bootstrapping, deployment, cache
behavior, and rollback MUST be documented before shared infrastructure is
applied. Provisioning, modifying, or destroying AWS resources requires explicit
human approval.

Rationale: A small static surface and reviewable infrastructure reduce security,
reliability, and operational risk.

### V. Simplicity and Explicit Change Control

Designs MUST favor a static build, cohesive modules, explicit responsibilities,
deterministic behavior, and clear boundaries between content, presentation, and
infrastructure. Speculative abstractions, unnecessary frameworks or services,
premature optimization, and unrelated refactoring MUST be avoided.

Significant architectural decisions MUST be justified by project requirements
and documented in the relevant Spec Kit plan. Changes MUST remain focused on
the active feature, bug, or maintenance task. Material expansion of accepted
scope requires explicit human approval.

Application and infrastructure code MUST reside in separate top-level modules:
`webapp/` and `infra/`. Shared code or automation MUST remain clearly identified
rather than being duplicated or hidden across those modules.

Rationale: Keeping the architecture small and decisions explicit preserves
maintainability and controls operational cost.

## Operational Constraints

All persistent repository artifacts, including specifications, plans, tasks,
checklists, bug artifacts, JSON content, documentation, code comments,
identifiers, branch names, commit messages, and pull-request content, MUST be
written in English.

Existing dependencies MUST be preferred when they reasonably meet a
requirement. Adding, removing, or replacing a third-party dependency requires
explicit human approval.

The web application has no database and MUST remain independently buildable from
repository content. Mutable server-side data, user accounts, authentication,
analytics, and tracking are outside the initial scope unless introduced through
an accepted specification.

AWS infrastructure MUST be defined and managed exclusively through Terraform.
AWS service selection MUST be based on security, reliability, maintainability,
operational complexity, expected cost, and static-site delivery requirements.
Every managed resource SHOULD carry consistent project and environment
identification where the service supports it.

Application source, tests, documentation, infrastructure, and Spec Kit artifacts
MUST remain limited to approved scope. Unrelated issues MUST be reported
separately rather than repaired opportunistically.

## Development Workflow and Quality Gates

Feature and behavioral work MUST proceed through Specify, Clarify, Plan,
Checklist when appropriate, Tasks, Analyze, Implement, Converge, Validate, and
draft pull-request preparation. A blocking ambiguity, constitutional violation,
or Spec Kit quality-gate result MUST NOT be bypassed without explicit human
approval.

Bug fixes MUST use the installed bug workflow to assess the defect, confirm
existing intended behavior, determine the root cause, implement a minimal
remediation, add focused regression coverage where practical, and validate the
correction. If the requested outcome changes intended behavior, the work MUST be
reclassified as a feature.

Before review, contributors MUST verify as applicable that accepted behavior is
implemented, JSON data and internal references validate, relevant tests exist
and pass, configured static checks pass, documentation is current, and Spec Kit
artifacts remain accurate. Incomplete validation MUST be reported explicitly.

Routine CI MUST favor fast unit tests, component tests, content validation,
static analysis, production builds, and Terraform static checks using local
fixtures. Routine CI MUST NOT depend on deployed AWS resources or external
network access unless an accepted requirement explicitly requires it.

Browser end-to-end tests, live AWS integration tests, and manual acceptance or
performance checks MUST NOT run in routine CI unless an accepted requirement
makes them necessary and their expected cost has explicit human approval.
Excluding those checks MUST NOT weaken meaningful unit and content coverage.

Module workflows SHOULD install dependencies once and combine compatible fast
quality gates in one job where practical. Infrastructure planning SHOULD run
only when infrastructure code or shared automation is affected. Pull requests
MUST NOT deploy application artifacts or apply infrastructure.

Deployment and infrastructure apply automation, once specified, MUST run only
for approved events on the `main` integration branch, rerun applicable quality
gates against the delivered revision, and create a fresh Terraform plan before
mutation. No workflow may provision, modify, or destroy shared AWS resources
without the required human approval.

All branch, commit, and pull-request operations MUST comply with
`CONTRIBUTING.md`. Changes after the initial bootstrap MUST be developed on a
dedicated branch and integrated through a pull request. Agents MUST NOT merge
their own pull requests.

## Governance

This Constitution governs all project artifacts after explicit user
instructions for the current task. Accepted specifications, plans, tasks, bug
artifacts, contribution guidance, and repository conventions MUST comply with
it. Conflicts MUST be resolved according to the precedence defined in
`AGENTS.md`.

Constitutional amendments require explicit human approval. Every amendment MUST
document its rationale, affected principles or sections, compatibility impact,
and required follow-up work in the Sync Impact Report.

Constitution versions follow semantic versioning:

- MAJOR for backward-incompatible governance changes, principle removals, or
  material redefinitions.
- MINOR for new principles, new governance sections, or materially expanded
  requirements.
- PATCH for clarifications and non-semantic wording corrections.

Every specification, plan, implementation, and pull-request review MUST verify
constitutional compliance. Any justified exception MUST be documented and
explicitly approved before affected work proceeds.

**Version**: 1.0.0 | **Ratified**: 2026-09-05 | **Last Amended**: 2026-09-05
