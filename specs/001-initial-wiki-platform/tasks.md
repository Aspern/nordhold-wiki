---
description: "Dependency-ordered implementation tasks for the initial Nordhold wiki platform"
---

# Tasks: Initial Nordhold Wiki Platform

**Input**: Design documents from `/specs/001-initial-wiki-platform/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Automated tests are limited to Vitest unit tests for functional domain
requirements. Schema/content validation, static analysis, builds, Terraform
validation, manual interface review, and the required deployed-site smoke check
are quality or operational checks rather than automated test suites. Component,
DOM, browser E2E, Terraform mock, workflow-contract, live-AWS integration,
visual-regression, performance, accessibility, and broad UI/UX automated tests
are intentionally excluded.

**Organization**: Tasks are grouped by user story after shared setup and
foundational work. Every story has an independent test boundary. Human approval
tasks are blocking gates and do not grant approval merely by appearing here.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after its stated prerequisite phase because it
  changes different files and does not rely on another incomplete parallel task.
- **[Story]**: Maps the task to one specification user story.
- Every task names the concrete repository file or directory it changes or
  validates.

## Phase 1: Setup (Shared Tooling)

**Purpose**: Establish the approved branch, dependency, build, quality, and ignore
configuration used by every later phase.

**Blocking approvals**: T002 must be completed by a human before T003 or any
dependency installation/provider initialization occurs.

- [x] T001 Create and switch to `feature/initial-wiki-platform` before implementation changes and verify the planned branch remains recorded in `specs/001-initial-wiki-platform/plan.md`
- [x] T002 Verify the unresolved extractor-license metadata and obtain explicit human approval for every exact version plus its security, license, maintenance, compatibility, and bundle/operational impact in `specs/001-initial-wiki-platform/research.md`; do not install or add dependencies before approval
- [x] T003 After T002, create `webapp/package.json` and `webapp/package-lock.json` with exactly the approved application and development versions from `specs/001-initial-wiki-platform/research.md`, Node 24 engines, and named validation/build scripts; pause for renewed approval before any version deviation
- [x] T004 [P] Configure strict TypeScript, Vue SFC checking, Vite, Vuetify tree-shaking, local-only assets, and typed build variables in `webapp/tsconfig.json`, `webapp/tsconfig.app.json`, `webapp/tsconfig.node.json`, `webapp/vite.config.ts`, and `webapp/src/env.d.ts`
- [x] T005 [P] Configure type-aware ESLint flat rules for Vue and TypeScript without formatting overlap in `webapp/eslint.config.ts`
- [x] T006 [P] Configure repository-consistent Prettier checking and editor defaults in `webapp/.prettierrc.json`, `webapp/.prettierignore`, and `webapp/.editorconfig`
- [x] T007 [P] Configure Vitest in the Node environment for functional unit tests, coverage, and JUnit reporting in `webapp/vitest.config.ts` without DOM, component, or browser test dependencies
- [x] T008 [P] Create root ignore rules for Node outputs, reports, temporary extraction data, Terraform working data, state, and plans while retaining both lockfiles in `.gitignore`

**Checkpoint**: Approved, locked tooling can be installed reproducibly and no
implementation output or infrastructure state is accidentally tracked.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the validated static-content boundary, reproducible source
workflow, complete first-release content, base localization/theme services, and
Vue application shell required by all user stories.

**Critical**: No user-story implementation begins until this phase passes its
content, provenance, artwork, and framework checks.

- [x] T009 Copy the accepted Draft 2020-12 contracts into `webapp/src/content/schemas/` and add a byte-for-byte drift check against `specs/001-initial-wiki-platform/contracts/` in `webapp/scripts/check-contract-sync.ts`
- [x] T010 [P] Define strict TypeScript types and classification constants for content, provenance, stable-ID maps, visuals, and localization values in `webapp/src/types/content.ts`
- [x] T011 [P] Create minimal valid, malformed, duplicate, obsolete, unresolved-reference, missing-English, missing-German-name, and missing-German-summary fixtures in `webapp/tests/fixtures/content/`
- [x] T012 Add failing functional unit tests for schemas, unique IDs, cross-references, banner affinity, four-way classification, English fallback, mandatory bilingual effect summaries, provenance, canonical order, and visual completeness in `webapp/tests/unit/content-validation.spec.ts`
- [x] T013 Implement Ajv Draft 2020-12 schema loading plus all cross-file, localization, provenance, visual digest/dimension, placeholder, and canonical-order gates in `webapp/scripts/validate-content.ts`
- [x] T014 Add failing functional unit tests for stable aliases, 64-bit path IDs, runtime banner-manager eligibility, obsolete/duplicate exclusion, parse-error handling, uncertainty reporting, and byte-stable facts in `webapp/tests/unit/normalization.spec.ts`
- [x] T015 Implement deterministic raw-interchange normalization, stable-ID preservation, eligibility/classification derivation, editorial-field merging, and provenance generation in `webapp/scripts/normalize-game-data.ts`
- [x] T016 After T002 and T015, use `.agents/skills/nordhold-game-data/scripts/extract_game_data.py` read-only against the recorded local Steam build, keep raw output only in a verified temporary directory, and review all parse errors and uncertainties before normalization
- [x] T017 Generate `specs/001-initial-wiki-platform/content-inventory.md` through `webapp/scripts/generate-content-checklist.ts` with one review item per extracted stable tower and banner ID covering localized names, independently worded summaries, classification/eligibility where applicable, visual path, authorship/license evidence, provenance, and review status
- [x] T018 [P] Complete every tower item in `specs/001-initial-wiki-platform/content-inventory.md`, use the nine exact authorized PNG sprites and build-specific extraction manifest under `webapp/src/assets/entities/towers/`, and supply reviewed independently worded English/German editorial fields without copying bulk game text
- [x] T019 [P] Complete every banner item in `specs/001-initial-wiki-platform/content-inventory.md`, define its distinct original deterministic CSS visual, and review its independently worded English/German editorial fields, classification, eligibility, and provenance without copying game artwork or bulk text
- [x] T020 After T018 and T019, normalize the reviewed extraction into `webapp/src/content/wiki-content.json`, `webapp/src/content/provenance.json`, and `webapp/src/content/id-map.json`; repeat normalization from the same inputs with no factual or ordering diff and run the complete production content gate
- [x] T021 [P] Add failing tests for validated content loading, immutable indexes, stable sorting, safe text-only values, and unresolved-record rejection in `webapp/tests/unit/content-repository.spec.ts`
- [x] T022 Implement the validated in-memory content repository and tower/banner indexes in `webapp/src/content/contentRepository.ts`
- [x] T023 [P] Create the shared Vue I18n plugin skeleton and initial English/German catalogues in `webapp/src/i18n/index.ts`, `webapp/src/i18n/messages/en.json`, and `webapp/src/i18n/messages/de.json`
- [x] T024 [P] Define semantic Nordhold-inspired color, typography, spacing, radius, elevation, focus, motion, and breakpoint tokens with Vuetify mappings in `webapp/src/theme/tokens.css` and `webapp/src/theme/index.ts`
- [x] T025 Assemble the Vue/Vuetify application shell and plugin factory without view-specific style literals in `webapp/src/main.ts`, `webapp/src/App.vue`, and `webapp/src/app/plugins.ts`

**Checkpoint**: The complete source-derived dataset and original/authorized visual
set validate deterministically; a typed, themed, localized application shell can
consume them without Steam, Python, AWS, or a backend.

---

## Phase 3: User Story 1 - Discover and Search Towers (Priority: P1) MVP

**Goal**: Present every active tower exactly once as a recognizable, localized,
responsive catalogue item and filter it predictably by the displayed name.

**Independent Test**: Load the accepted game-derived fixture; verify complete,
unique tower coverage and correct visuals/summaries; search by full, partial,
mixed-case, whitespace-padded, German-character, empty, and nonmatching values.
Manually confirm the implemented page and clear action are keyboard operable.

### Tests for User Story 1

- [x] T026 [P] [US1] Add failing functional unit tests for NFC-normalized locale-aware case-insensitive tower substring filtering, trim/empty behavior, and stable order in `webapp/tests/unit/tower-search.spec.ts`
- [x] T027 [P] [US1] Add failing functional unit tests for the catalogue read model: one item per active tower, localized names/summaries, correct visual references, result counts, and empty/no-results/clear states in `webapp/tests/unit/tower-catalogue.spec.ts`

### Implementation for User Story 1

- [x] T028 [US1] Implement reusable query normalization and tower filtering without fuzzy matching or hidden-source-key search in `webapp/src/app/search.ts`
- [x] T029 [P] [US1] Implement the semantic keyboard-operable tower presentation card using only theme tokens in `webapp/src/components/TowerCard.vue`
- [x] T030 [P] [US1] Implement a labelled clearable Material search control with visible focus and accessible empty-query behavior in `webapp/src/components/SearchField.vue`
- [x] T031 [US1] Implement the complete responsive catalogue, live filtering, localized result count, and no-results state in `webapp/src/pages/TowerCataloguePage.vue`
- [x] T032 [US1] Register the catalogue root and connect it to the application shell in `webapp/src/router/index.ts` and `webapp/src/App.vue`
- [x] T033 [US1] Add all catalogue, tower-search, result-count, clear, and empty-state messages with English/German key parity in `webapp/src/i18n/messages/en.json` and `webapp/src/i18n/messages/de.json`

**Checkpoint**: User Story 1 passes independently and forms the non-deployed MVP
demonstration; public release still waits for the remaining stories and US6.

---

## Phase 4: User Story 2 - Explore Every Banner for a Tower (Priority: P1)

**Goal**: Select or directly open a stable tower route and display exactly its
eligible active banners once in the four mutually exclusive classifications,
with safe unknown-route recovery.

**Independent Test**: For every fixture tower, compare rendered identifiers and
groups to eligibility; verify multi-tower banners, empty valid groups, obsolete,
duplicate, and ineligible exclusions; directly load valid, unknown, and malformed
paths; return to the complete catalogue using keyboard navigation.

### Tests for User Story 2

- [x] T034 [P] [US2] Add failing unit tests for eligibility joins, tower-affinity enforcement, four-group partitioning, stable ordering, and obsolete/duplicate/ineligible exclusion in `webapp/tests/unit/banner-eligibility.spec.ts`
- [x] T035 [P] [US2] Add failing functional unit tests for stable route parsing and the tower-detail read model, including valid/unknown/malformed identifiers, complete grouped banner records, empty valid groups, and localized not-found/return states in `webapp/tests/unit/tower-detail.spec.ts`

### Implementation for User Story 2

- [x] T036 [US2] Implement the selected-tower read model and exact eligibility/grouping service in `webapp/src/app/bannerEligibility.ts`
- [x] T037 [P] [US2] Implement a semantic banner card with localized name, bilingual summary, distinct visual, and non-color-only classification in `webapp/src/components/BannerCard.vue`
- [x] T038 [US2] Implement labelled classification sections that omit no eligible group and do not imply missing data for a legitimately empty group in `webapp/src/components/BannerGroup.vue`
- [x] T039 [US2] Implement the selected tower header, grouped eligible banners, and catalogue-return action in `webapp/src/pages/TowerDetailPage.vue`
- [x] T040 [US2] Implement a localized semantic not-found view with a keyboard-operable catalogue return in `webapp/src/pages/NotFoundPage.vue`
- [x] T041 [US2] Add `/towers/:towerId`, identifier validation, direct-load behavior, and the localized catch-all route defined by `specs/001-initial-wiki-platform/contracts/routes.md` in `webapp/src/router/index.ts`
- [x] T042 [US2] Convert tower selection to stable language-independent route links while retaining accessible card behavior in `webapp/src/components/TowerCard.vue`
- [x] T043 [US2] Add tower-detail, return, not-found, and four classification labels with English/German key parity in `webapp/src/i18n/messages/en.json` and `webapp/src/i18n/messages/de.json`

**Checkpoint**: User Stories 1 and 2 work together, and User Story 2 can still be
tested directly through stable route fixtures without navigating through US1.

---

## Phase 5: User Story 3 - Search Within Eligible Banners (Priority: P2)

**Goal**: Filter only the selected tower's already eligible banner set by the
displayed localized name without changing grouping or introducing other banners.

**Independent Test**: On a tower spanning multiple classes, search full, partial,
mixed-case, whitespace-padded, German-character, empty, and nonmatching terms;
verify results remain eligible and preserve groups. Manually confirm the clear
action is keyboard operable and filtering does not reload the page.

### Tests for User Story 3

- [x] T044 [P] [US3] Add failing functional unit tests for localized banner substring filtering, trim/empty behavior, stable grouping, and ineligible-record isolation in `webapp/tests/unit/banner-search.spec.ts`
- [x] T045 [P] [US3] Add failing functional unit tests for banner-search view-state transitions, localized result counts, no-results state, and clear behavior in `webapp/tests/unit/banner-search-state.spec.ts`

### Implementation for User Story 3

- [x] T046 [US3] Implement filtering over the precomputed eligible banner read model while preserving classification order in `webapp/src/app/bannerSearch.ts`
- [x] T047 [US3] Integrate the shared search control, result state, group filtering, and clear action into `webapp/src/pages/TowerDetailPage.vue`
- [x] T048 [US3] Add banner-search, result-count, clear, and no-results messages with English/German key parity in `webapp/src/i18n/messages/en.json` and `webapp/src/i18n/messages/de.json`

**Checkpoint**: Banner search is independently verified never to expand the
selected tower's eligibility set.

---

## Phase 6: User Story 4 - Use the Wiki in the Visitor's Language (Priority: P2)

**Goal**: Choose the first supported ordered browser locale automatically, use
English otherwise, render all interface messages in English/German, and safely
fall back for unavailable German game values.

**Independent Test**: Start fresh instances with ordered German, regional German,
English, mixed, and unsupported preferences; verify the selected locale, complete
catalogue/detail/search text, English content fallback without raw keys, and a
validation failure when required English or either effect-summary locale is absent.

### Tests for User Story 4

- [x] T049 [P] [US4] Add failing unit tests for ordered `navigator.languages` negotiation, regional normalization, deduplication, and English fallback in `webapp/tests/unit/locale-selection.spec.ts`
- [x] T050 [P] [US4] Add failing functional unit tests for interface-catalogue key parity, missing-English failure, mandatory bilingual effect summaries, detectable missing German names/alt text, and safe English fallback in `webapp/tests/unit/localization-validation.spec.ts`
- [x] T051 [P] [US4] Add failing functional unit tests for localized catalogue, detail, search, empty, error, classification, and navigation message resolution under German, English, and unsupported preferences without exposing localization keys in `webapp/tests/unit/localized-state.spec.ts`

### Implementation for User Story 4

- [x] T052 [P] [US4] Implement ordered browser-locale selection and regional normalization as a pure function in `webapp/src/i18n/detectLocale.ts`
- [x] T053 [P] [US4] Implement typed localized game-content access with English fallback and development diagnostics for unavailable German values in `webapp/src/i18n/localizeContent.ts`
- [x] T054 [US4] Configure Vue I18n Composition API mode, browser initialization, explicit English fallback, text-only interpolation, and non-key production warnings in `webapp/src/i18n/index.ts`
- [x] T055 [US4] Complete and alphabetize all required interface keys with exact English/German parity in `webapp/src/i18n/messages/en.json` and `webapp/src/i18n/messages/de.json`
- [x] T056 [US4] Route all visible catalogue, detail, banner-search, classification, empty, and not-found content through the shared locale accessors in `webapp/src/pages/TowerCataloguePage.vue` and `webapp/src/pages/TowerDetailPage.vue`

**Checkpoint**: Locale behavior and validation pass independently for all required
browser-preference and fallback cases.

---

## Phase 7: User Story 5 - Identify the Published Wiki Release (Priority: P2)

**Goal**: Show title, attribution, package version, and immutable localized build
date on every main view from one validated build-generated release record.

**Independent Test**: Build with known version/date/SHA; render catalogue and
tower detail at wide and small layouts; verify the same version/date appears,
matches package/build metadata, localizes by active locale, and does not change
when the client clock changes.

### Tests for User Story 5

- [x] T057 [P] [US5] Add failing unit tests for package-version equality, UTC build-date and full-SHA validation, malformed/missing input rejection, deterministic output, and client-clock independence in `webapp/tests/unit/release-metadata.spec.ts`
- [x] T058 [P] [US5] Add failing functional unit tests for the header read model, including title, subordinate attribution, package version, locale-formatted immutable date, and identical metadata across catalogue/detail states in `webapp/tests/unit/header-model.spec.ts`

### Implementation for User Story 5

- [x] T059 [US5] Define the release metadata type, schema-backed loader, and generated-module declaration in `webapp/src/types/release.ts` and `webapp/src/generated/release.ts`
- [x] T060 [US5] Implement one-time release generation from `webapp/package.json`, `NORDHOLD_BUILD_DATE`, and `NORDHOLD_COMMIT_SHA` with atomic validated outputs in `webapp/scripts/generate-release-metadata.ts`
- [x] T061 [US5] Integrate release generation into the Vite production build and emit public `release.json` plus a checksummed bundle manifest containing version, date, full commit SHA, and one valid built tower route in `webapp/vite.config.ts`
- [x] T062 [US5] Implement the responsive themed header with title, attribution, version, and locale-formatted immutable build date in `webapp/src/components/WikiHeader.vue`
- [x] T063 [US5] Mount the shared header around every main router view in `webapp/src/App.vue`
- [x] T064 [US5] Add release labels, attribution, and date-format messages with English/German key parity in `webapp/src/i18n/messages/en.json` and `webapp/src/i18n/messages/de.json`

**Checkpoint**: Release identity is generated once per artifact and remains
consistent on every view and client date.

---

## Phase 8: User Story 6 - Prepare Verified Delivery (Priority: P3)

**Goal**: Define and validate the source for the exact validate, build, plan,
approved deploy, and verify flow through CloudFront and a private S3 origin,
without committing credentials, state, plan files, or manually assembled content.

**Independent Check**: Run source-only Terraform formatting/validation and
application quality commands, inspect the workflow against the CI contract, and
confirm no AWS credentials or mutation are involved. Live deployment verification
is deferred to the post-review production phase.

**Mutation boundary**: T065-T081 create and validate source only. They MUST NOT
initialize a shared backend, assume an AWS role, plan against a shared account,
apply Terraform, change one.com DNS, upload production assets, or invalidate
CloudFront.

### Infrastructure and Verification Implementation

- [x] T065 [US6] Configure Terraform CLI 1.16.1, the approved locked `hashicorp/aws` provider 6.63.0, `eu-central-1` default plus `us-east-1` certificate alias, input validation, and default project/environment/management/service/cost tags in `infra/bootstrap/versions.tf`, `infra/bootstrap/main.tf`, and `infra/bootstrap/variables.tf`
- [x] T066 [US6] Define the TLS-only, encrypted, public-blocked, versioned remote-state bucket and native lockfile policy in `infra/bootstrap/state.tf`
- [x] T067 [US6] Define the tagged `us-east-1` ACM request for `nordhold.asperntallow.de` and reviewable one.com DNS-validation outputs in `infra/bootstrap/certificate.tf`
- [x] T068 [US6] Resolve the existing account-wide GitHub OIDC provider by its canonical URL and define a repository/PR-scoped non-resource-mutating plan role plus a protected-production-environment apply role using the organization's stable numeric owner/repository subject template in `infra/bootstrap/iam.tf`; do not manage the shared provider, restrict the plan role to required resource `Get`/`List`/`Describe` actions, exact-state-prefix list/get/put access, and exact `.tflock` get/put/delete access, and reserve Terraform resource mutation, S3 publication, and CloudFront invalidation for the apply role
- [x] T069 [US6] Expose only non-secret bootstrap outputs and document local-to-remote state migration inputs in `infra/bootstrap/outputs.tf` and `infra/bootstrap/main.tf`
- [x] T070 [US6] Configure the production remote backend, exact provider lock, `eu-central-1` resources, issued certificate ARN validation, environment separation, and default tags in `infra/production/backend.tf`, `infra/production/providers.tf`, `infra/production/versions.tf`, and `infra/production/variables.tf`
- [x] T071 [US6] Define the encrypted, public-blocked, versioned application bucket, TLS-only policy, and no public write/read path in `infra/production/s3.tf` without adding custom object-retention settings
- [x] T072 [P] [US6] Implement the minimal viewer-request rewrite contract for root and extensionless application routes without rewriting assets, JSON, or file-extension paths in `infra/production/functions/rewrite.js`
- [x] T073 [US6] Define CloudFront OAC and source-ARN bucket access, ACM TLS, HTTP redirect, PriceClass 100, immutable asset and revalidating shell/JSON caches, targeted invalidation support, CSP and security headers, IPv6, direct-route function association, and the reviewed initial omission of WAF/custom access logging in `infra/production/cloudfront.tf`
- [x] T074 [US6] Add distribution, bucket, domain, and unsupported-tagging outputs plus explicit safe deployment identifiers in `infra/production/outputs.tf`
- [x] T075 [US6] Implement the bounded public release smoke checker for trusted HTTPS, HTTP redirect, content types, one manifest-provided tower route, and exact version/SHA verification in `webapp/scripts/verify-release.ts`

### Workflow and Operations Implementation

- [x] T076 [US6] Create the GitHub Actions `validate` stage with the exact approved action SHAs, pull-request path policy, exact `infra:validate` and `app:validate` display names, one locked app install, attributable reports, Terraform format/validate, ESLint, Prettier, typecheck, content validation, functional Vitest unit tests, and `npm audit --json --audit-level=high` in `.github/workflows/wiki-platform.yml`; permit only the specified npm and Terraform registry access for dependency setup
- [x] T077 [US6] Add the `build` stage with exact `app:build` and `infra:plan` display names, both depending on applicable validation, full release checks on `main`, PR infrastructure planning for infrastructure/shared-automation changes only after the one-time bootstrap exists, one checksummed versioned bundle, one fresh saved production plan, non-resource-mutating OIDC plan credentials, repository-default artifact retention, and no apply in `.github/workflows/wiki-platform.yml`
- [x] T078 [US6] Add an exact `infra:apply` job restricted to protected approved `main` that verifies and applies the saved plan, followed by an exact `app:deploy` job that verifies and publishes the retained bundle with scoped S3 cache metadata and targeted CloudFront invalidation without rebuilding or applying Terraform; serialize the complete production workflow in `.github/workflows/wiki-platform.yml`
- [x] T079 [US6] Add the exact `infra:verify` job after deployment using the promoted manifest and `webapp/scripts/verify-release.ts`, and make smoke failure prevent release success in `.github/workflows/wiki-platform.yml`
- [x] T080 [US6] Write the command-level human-assisted bootstrap, state locking/recovery, ACM and one.com DNS, GitHub environment/OIDC, cache, cost, deployment, invalidation, and constitution-required minimal source-revert rollback procedure in `infra/README.md` without inventing retention or recovery-time targets
- [x] T081 [US6] Run Terraform formatting, locked-provider `init -backend=false`, and `terraform validate` for both roots without AWS credentials, review the workflow statically against `specs/001-initial-wiki-platform/contracts/ci-cd.md`, and resolve every source-only failure in `infra/`, `.github/workflows/wiki-platform.yml`, and `webapp/scripts/verify-release.ts`

**Checkpoint**: Delivery source and operational documentation are locally
reviewable; no AWS resource, DNS record, or production application has changed.

---

## Phase 9: Polish and Cross-Cutting Validation

**Purpose**: Close security, manual interface acceptance, documentation,
reporting, and source-only quickstart evidence before Spec Kit convergence and
draft pull-request review.

- [x] T082 [P] Implement a bundle-policy validator that rejects source maps, raw dumps, binaries, copied/unreviewed media, absolute local paths, secrets, state/plans, remote scripts/fonts, and release/content contract drift in `webapp/scripts/validate-bundle.ts`
- [x] T083 Create `specs/001-initial-wiki-platform/manual-review.md`, conduct the post-implementation human review for semantic structure, labels, keyboard flow, focus, non-color-only classes, responsive layouts, text alternatives, WCAG 2.2 AA contrast, and distinct correctly mapped recognizable original/authorized visuals, then revise and repeat rejected items until accepted
- [x] T084 [P] Document approved setup, scripts, content provenance/refresh boundaries, theme rules, local development, functional unit coverage, manual review, and production-build inputs in `webapp/README.md`
- [x] T085 [P] Document the static no-backend architecture, visitor routes, module boundaries, contribution workflow, and links to feature/runbook artifacts in `README.md`
- [x] T086 Finalize one-command attributable application validation, report collection, deterministic build checks, and informational bundle-size reporting in `webapp/package.json`
- [x] T087 Execute every safe local application command and manual development-server scenario in `specs/001-initial-wiki-platform/quickstart.md`, resolving failures without weakening assertions or adding excluded automated test scope
- [x] T088 Execute Terraform formatting, locked-provider backend-disabled validation, ignore-rule checks, workflow inspection, and documentation review from `specs/001-initial-wiki-platform/quickstart.md` without reading or changing deployed resources
- [x] T089 Record actual functional unit, content-validation, build, Terraform-validation, workflow-inspection, and manual keyboard/responsive/visual results plus dependency approval and any incomplete validation in `specs/001-initial-wiki-platform/validation.md`

**Checkpoint**: Source implementation and source-only validation are complete and
ready for `$speckit-converge`, final validation, and draft pull-request review.

---

## Phase 10: Initial Bootstrap and Post-Review Production Enablement (Operational)

**Purpose**: Establish the one-time CI prerequisites outside CI, then deploy and
verify the first wiki release through CI only after the accepted source completes
the repository lifecycle.

**Blocking lifecycle gate**: Do not execute T090-T093 during the initial
`$speckit-implement` pass. First complete Phase 9, run `$speckit-converge`, resolve
all resulting tasks, rerun full validation, prepare a draft pull request, and
obtain human review of the exact bootstrap plans. T090 may then run outside CI
before merge only with fresh explicit approval; it publishes no wiki bundle.
After T090, rerun the pull-request workflow including `infra:plan`, complete human
review, and have a human integrate the accepted revision into `main`. Every AWS
or DNS mutation and the production environment still require their explicit
approvals.

- [x] T090 [US6] After the pre-bootstrap lifecycle gate and fresh explicit human approval, verify the existing compatible account-wide GitHub OIDC provider, then follow `infra/README.md` outside CI to apply reviewed bootstrap and initial production-infrastructure plans that contain no shared-provider mutation, migrate state to the verified remote keys, add and retain the one.com ACM validation CNAME, confirm certificate issuance, configure protected GitHub OIDC variables/environment, create the empty static-delivery resources, add the one.com `nordhold` CNAME, and verify origin privacy, HTTPS, tags, caches, and state recovery without publishing a wiki bundle or committing account values
- [ ] T091 [US6] After T090, rerun the pull-request workflow so the non-resource-mutating `infra:plan` reads the bootstrapped remote state, review and record the result, and require completed human pull-request review plus human integration of the accepted revision into `main` before production release
- [ ] T092 [US6] Trigger an approved release of the integrated `main` revision through `.github/workflows/wiki-platform.yml`; require `infra:apply` to apply the fresh CI plan before `app:deploy` publishes the exact bundle, verify all seven exact jobs and trace artifacts, and require `webapp/scripts/verify-release.ts` to confirm the deployed package version, commit SHA, HTTPS root, and direct tower route
- [ ] T093 [US6] Append AWS approval, bootstrap, deployment, and smoke-check evidence plus any unresolved production issue to `specs/001-initial-wiki-platform/validation.md`

**Checkpoint**: The public wiki is reachable at the required trusted HTTPS domain
and the release is successful only when the exact promoted artifact passes the
operational smoke check.

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 - Setup**: Starts immediately, but T002 blocks every dependency or
  provider installation.
- **Phase 2 - Foundational**: Depends on Setup and blocks all story implementation.
- **Phase 3 - US1**: Starts after Foundational and is the first functional MVP.
- **Phase 4 - US2**: Its direct-route/detail implementation can start after
  Foundational; T042 integrates with US1 and therefore waits for T029.
- **Phase 5 - US3**: Depends on the US2 eligible-banner view model and page.
- **Phase 6 - US4**: Locale primitives can start after Foundational; T056 waits for
  the story views whose text it routes through i18n.
- **Phase 7 - US5**: Metadata generation/header work can start after Foundational;
  cross-view/date localization integration waits for US4 and the main views.
- **Phase 8 - US6 source**: Source-only infrastructure, runbook, smoke-script, and
  CI work can start after Foundational and never authorizes AWS mutation.
- **Phase 9 - Polish**: Depends on US1-US6 source implementation. Its validation
  record and human interface review must complete before convergence.
- **Phase 10 - Bootstrap and production**: T090 depends on completed convergence,
  full validation, a reviewed draft pull request, and fresh bootstrap approval.
  T091 reruns the now-enabled PR plan and gates human integration to `main`.
  T092-T093 depend on that integration and protected production approval.

### User Story Dependency Graph

```text
Setup -> Foundational -> US1 ------------------------+
                     -> US2 -> US3 ------------------+--> US6 source -> Polish
                     -> US4 (integrates US1-US3) ----+
                     -> US5 (integrates views + US4) -+

Polish -> Converge -> Full validation -> Draft PR -> Bootstrap approval/run
       -> PR plan rerun -> Human review/merge -> Approved verified main release
```

### Within Each User Story

1. Add only the listed functional unit tests before their corresponding domain
   implementation.
2. Build pure types/read models before components or workflow integration.
3. Implement presentation and infrastructure source without adding automated UI
   or infrastructure test suites.
4. Run unit, static, and manual independent criteria at the story checkpoint as
   applicable.
5. Do not proceed through an approval or production-mutation task without the
   explicit current human authorization required by that task.

### Parallel Opportunities

- After T003, T004-T008 can proceed in parallel across separate configuration
  files.
- In Foundational, type/fixture/test preparation and theme/i18n setup marked [P]
  can proceed independently; T018 and T019 split tower and banner editorial work
  after T017 creates the extracted entity checklist.
- US1 search/card/control work, US2 grouping cards, and each story's functional
  unit tests have file-level parallel paths as marked.
- US4 locale detection and content fallback can be implemented in parallel after
  their tests exist.
- US6 bootstrap Terraform, production Terraform, CloudFront function, workflow,
  and smoke-script source can be authored concurrently; actual AWS/DNS operations
  remain post-review, sequential, and approval-gated.
- Documentation and the bundle validator in Phase 9 can proceed in parallel;
  T083's completed human review and T089's record wait for the implemented result.

---

## Parallel Examples by User Story

### User Story 1

```text
Task T026: tower search unit tests in webapp/tests/unit/tower-search.spec.ts
Task T027: catalogue read-model unit tests in webapp/tests/unit/tower-catalogue.spec.ts

After search contracts are known:
Task T029: tower card in webapp/src/components/TowerCard.vue
Task T030: search control in webapp/src/components/SearchField.vue
```

### User Story 2

```text
Task T034: eligibility unit tests in webapp/tests/unit/banner-eligibility.spec.ts
Task T035: route/detail read-model unit tests in webapp/tests/unit/tower-detail.spec.ts

After the grouping service contract is fixed:
Task T037: banner card in webapp/src/components/BannerCard.vue
Task T038: banner groups in webapp/src/components/BannerGroup.vue
```

### User Story 3

```text
Task T044: banner-search unit tests in webapp/tests/unit/banner-search.spec.ts
Task T045: banner-search state unit tests in webapp/tests/unit/banner-search-state.spec.ts
```

### User Story 4

```text
Task T049: locale negotiation tests in webapp/tests/unit/locale-selection.spec.ts
Task T050: localization validation unit tests in webapp/tests/unit/localization-validation.spec.ts
Task T051: localized state unit tests in webapp/tests/unit/localized-state.spec.ts

After those contracts are fixed:
Task T052: browser locale selection in webapp/src/i18n/detectLocale.ts
Task T053: localized content fallback in webapp/src/i18n/localizeContent.ts
```

### User Story 5

```text
Task T057: release metadata tests in webapp/tests/unit/release-metadata.spec.ts
Task T058: header read-model tests in webapp/tests/unit/header-model.spec.ts
```

### User Story 6

```text
Task T066-T069: bootstrap state, certificate, IAM, and output source
Task T070-T074: production backend, origin, rewrite, distribution, and outputs
Task T075-T079: smoke checker and workflow source
```

---

## Implementation Strategy

### MVP First

1. Complete Setup, including dependency approval and exact lockfiles.
2. Complete the Foundational phase and validate the complete static dataset.
3. Complete US1 and run its independent catalogue/search checks.
4. Stop and review the non-deployed MVP; do not provision AWS merely to demo it.

### Incremental Delivery

1. Add US2 to provide the core tower-to-banner knowledge outcome.
2. Add US3 for eligible-banner search.
3. Add US4 and US5 for full locale and release traceability behavior.
4. Complete US6 source-only infrastructure, workflow, smoke, and runbook work.
5. Complete cross-cutting validation and human interface/visual review.
6. Run Spec Kit convergence, resolve any appended tasks, rerun full validation,
   and prepare the draft pull request.
7. After review of the draft PR and bootstrap plans, perform the separately
   approved one-time out-of-CI bootstrap without publishing the wiki, rerun the
   PR plan, complete human integration to `main`, and release the exact artifact
   through the protected CI workflow.

### Parallel Team Strategy

After Setup and Foundational are complete, separate contributors can work on the
US1 catalogue, US2 direct banner detail, US4 locale primitives, US5 release
metadata, and US6 source-only infrastructure in parallel. US3 waits for
US2's read model. One contributor owns each shared file at a time, especially
`webapp/src/App.vue`, locale catalogues, router configuration, and the single CI
workflow. AWS/DNS steps are never parallelized and remain human-approved.

## Notes

- A checked task means its concrete implementation and verification are complete,
  not merely that code was generated.
- T002 and T090 are mandatory dependency/bootstrap approval gates; T091 requires
  human pull-request review and integration, and T092 requires the protected
  production-environment approval built into the workflow.
- Production visuals must use the authorized exact tower PNGs or distinct original
  deterministic CSS banner definitions and be accepted through human review;
  development placeholders cannot satisfy T017-T020 or T083.
- Raw extraction data, game binaries/media, state, plan files, secrets, and real
  account values remain outside Git and the public bundle.
- Routine CI may access only the explicitly accepted npm and Terraform dependency
  endpoints for setup; it must not acquire Steam/extractor dependencies or add
  component, browser E2E, Terraform mock, workflow-contract, visual-regression,
  performance, accessibility, broad UX, or live-AWS automated test suites.
- Commit only logical groups using the repository's English Conventional Commit
  and pull-request rules; agents never merge their own pull requests.
