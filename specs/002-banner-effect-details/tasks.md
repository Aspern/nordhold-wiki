---

description: "Dependency-ordered implementation tasks for banner effect details"
---

# Tasks: Banner Effect Details

**Input**: Design documents from `specs/002-banner-effect-details/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by FR-013 and written before their associated implementation.

## Phase 1: Setup

**Purpose**: Establish the active contract and source-data fixture boundaries.

- [x] T001 Synchronize the active content contract baseline in `specs/002-banner-effect-details/contracts/wiki-content.schema.json` and `webapp/scripts/check-contract-sync.ts`
- [x] T002 Record the source build, extraction scope, and raw-dump exclusion in `specs/002-banner-effect-details/validation.md`

---

## Phase 2: Foundational

**Purpose**: Define the strict model and reusable decoder required by both content and presentation.

- [x] T003 Update banner effect types and schema validation in `webapp/src/types/content.ts` and `webapp/src/content/schemas/wiki-content.schema.json`
- [x] T004 [P] Add Odin decoder, source-text cleanup, and extraction tests in `webapp/tests/unit/banner-effects.spec.ts`
- [x] T005 Implement the Odin binary reader and strict source-value adapters in `webapp/scripts/extract-banner-effects.ts`

**Checkpoint**: The source binary can be decoded into validated, browser-independent effect records.

---

## Phase 3: User Story 1 - Read Exact Banner Effects (Priority: P1) MVP

**Goal**: Publish and display the original sanitized English and German descriptions for all 97 active banners.

**Independent Test**: Compare representative tower-specific, unique, fusion, and generalist banners with the raw build records and confirm that both locales preserve visible wording without tags or placeholders.

### Tests for User Story 1

- [x] T006 [US1] Add complete-inventory, bilingual-description, tag, placeholder, and malformed-source assertions in `webapp/tests/unit/content-validation.spec.ts` and `webapp/tests/unit/banner-effects.spec.ts`

### Implementation for User Story 1

- [x] T007 [US1] Integrate localization lookup, safe markup cleanup, placeholder resolution, and effect extraction into `webapp/scripts/generate-initial-content.ts`
- [x] T008 [US1] Replace banner editorial summaries with extracted effects in `webapp/scripts/normalize-game-data.ts`
- [x] T009 [US1] Regenerate the 97-banner checked-in dataset and provenance in `webapp/src/content/wiki-content.json` and `webapp/src/content/provenance.json`
- [x] T010 [US1] Present localized source descriptions through the banner view model and card in `webapp/src/app/bannerEligibility.ts` and `webapp/src/components/BannerCard.vue`

**Checkpoint**: Every banner displays its source-derived English or German description independently of rarity styling.

---

## Phase 4: User Story 2 - Compare Rarity Values at a Glance (Priority: P2)

**Goal**: Render every extracted effect as a compact, colored, accessible common/rare/legendary sequence.

**Independent Test**: Check signed, percentage, duration, multiplier, integer, equal-value, and multi-variable samples in both locales and a 320-pixel layout.

### Tests for User Story 2

- [x] T011 [P] [US2] Add value-formatting and localized accessibility-label tests in `webapp/tests/unit/banner-effects.spec.ts`
- [x] T012 [P] [US2] Add banner view-model mapping tests in `webapp/tests/unit/banner-eligibility.spec.ts`

### Implementation for User Story 2

- [x] T013 [US2] Implement pure rarity value formatting and accessibility semantics in `webapp/src/app/bannerEffects.ts`
- [x] T014 [US2] Map source effect values into the banner-card model in `webapp/src/app/bannerEligibility.ts`
- [x] T015 [US2] Render no-wrap slash sequences and localized accessible labels in `webapp/src/components/BannerCard.vue`
- [x] T016 [US2] Add the visible rarity key and localized rarity names in `webapp/src/pages/TowerDetailPage.vue`, `webapp/src/i18n/messages/en.json`, and `webapp/src/i18n/messages/de.json`
- [x] T017 [US2] Add WCAG-AA common, rare, and legendary tokens plus responsive no-overflow styles in `webapp/src/theme/tokens.css` and `webapp/src/components/BannerCard.vue`

**Checkpoint**: Common, rare, and legendary facts are compactly comparable without relying on color.

---

## Phase 5: User Story 3 - Identify the 1.0 Release (Priority: P3)

**Goal**: Report application version `1.0.0` consistently.

**Independent Test**: Inspect package, lockfile, generated release module, public metadata, and visible footer label.

### Tests for User Story 3

- [x] T018 [US3] Add or update version consistency assertions in `webapp/tests/unit/release-metadata.spec.ts`

### Implementation for User Story 3

- [x] T019 [US3] Set the package and lockfile version to `1.0.0` in `webapp/package.json` and `webapp/package-lock.json`
- [x] T020 [US3] Regenerate `1.0.0` release artifacts in `webapp/src/generated/release.ts` and `webapp/public/release.json`

**Checkpoint**: All application-owned release surfaces report `1.0.0`.

---

## Phase 6: Polish and Cross-Cutting Validation

**Purpose**: Prove contract, extraction, rendering, and release consistency as one deterministic static build.

- [x] T021 Update extraction and content maintenance guidance in `webapp/README.md`
- [x] T022 Run formatting, lint, type checking, unit/content tests, production build, deterministic-build, and bundle-validation commands from `specs/002-banner-effect-details/quickstart.md`
- [x] T023 Record source samples, counts, contrast results, validation commands, and raw-dump exclusion in `specs/002-banner-effect-details/validation.md`
- [x] T024 Run Spec Kit convergence against `specs/002-banner-effect-details/spec.md`, `specs/002-banner-effect-details/plan.md`, and `specs/002-banner-effect-details/tasks.md`

---

## Dependencies and Execution Order

- Setup precedes the shared model and decoder.
- T003–T005 block all user stories.
- User Story 1 establishes the descriptions and generated dataset required by User Story 2.
- User Story 3 is behaviorally independent after the foundational phase but is executed after the effect work for a single release validation.
- Polish and convergence require all three stories.

## Parallel Opportunities

- T004 can be prepared independently after the model contract is understood.
- T011 and T012 touch separate test boundaries and can run together.
- Release assertions can be prepared independently of UI styling after foundational work.

## Implementation Strategy

1. Establish the strict contract and decoder.
2. Complete User Story 1 as the content MVP and validate all 97 descriptions.
3. Add User Story 2 formatting and accessibility without changing extracted facts.
4. Apply User Story 3's version milestone.
5. Run the full validation and convergence gates.

No task authorizes a commit, push, pull request, dependency change, raw-data publication, or AWS mutation.

---

## Phase 7: User Story 2 Refinement - Fixed Non-Rarity Values (Priority: P2)

**Goal**: Keep rarity triplets only for tower-specific banners and show one fixed value for every generalist, unique, and fusion effect.

**Independent Test**: Inspect representative banners from all four classifications. Tower-specific effects retain common/rare/legendary slash sequences; the other classifications expose and render exactly one uncolored value per effect.

- [x] T025 [US2] Add fixed-value schema, normalization, formatter, view-model, and rendering regression coverage in `webapp/tests/unit/banner-effects.spec.ts`, `webapp/tests/unit/banner-eligibility.spec.ts`, and `webapp/tests/unit/content-validation.spec.ts`
- [x] T026 [US2] Define mutually exclusive rarity and fixed effect-value types and classification-aware contracts in `webapp/src/types/content.ts`, `webapp/src/content/schemas/wiki-content.schema.json`, and `specs/002-banner-effect-details/contracts/wiki-content.schema.json`
- [x] T027 [US2] Normalize identical non-tower-specific source slots to one fixed value and reject divergent slots in `webapp/scripts/generate-initial-content.ts`
- [x] T028 [US2] Map and format fixed versus rarity effect values with accurate accessibility text in `webapp/src/app/bannerEffects.ts` and `webapp/src/app/bannerEligibility.ts`
- [x] T029 [US2] Render one uncolored fixed value while retaining colored no-wrap rarity sequences in `webapp/src/components/BannerCard.vue`
- [x] T030 [US2] Regenerate classification-appropriate values for all 97 banners in `webapp/src/content/wiki-content.json`
- [x] T031 [US2] Update extraction guidance and verification evidence in `webapp/README.md` and `specs/002-banner-effect-details/validation.md`, then run the complete validation suite
- [x] T032 [US2] Run Spec Kit convergence for the refined value presentation against `specs/002-banner-effect-details/spec.md`, `specs/002-banner-effect-details/plan.md`, and `specs/002-banner-effect-details/tasks.md`

### Refinement Dependencies

- T025 and T026 establish the regression and contract boundaries.
- T027 depends on T026 and blocks regenerated content.
- T028 and T029 depend on T026 and may proceed before T030.
- T030 depends on T027; T031 depends on T025-T030; T032 runs last.
