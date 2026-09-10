# Implementation Plan: Banner Effect Details

**Branch**: `feature/banner-effect-details` | **Date**: 2026-09-08 | **Spec**: `specs/002-banner-effect-details/spec.md`

**Input**: Feature specification from `specs/002-banner-effect-details/spec.md`

## Summary

Replace editorial banner summaries with sanitized English and German descriptions from Nordhold Steam build `23261523`, decode both current `BannerVariable` records and legacy value dictionaries from Odin binary payloads, and render tower-specific effects as accessible common/rare/legendary slash sequences. Generalist, unique, and fusion effects are normalized from three identical source slots to one fixed value and rendered once. The implementation extends the existing static JSON contract and Vue/Vuetify presentation without adding dependencies, a runtime service, or persistence. Application-owned release metadata is updated to `1.0.0`.

## Technical Context

**Language/Version**: TypeScript 6.0 on Node.js 24; Vue single-file components

**Primary Dependencies**: Existing Vue 3.5, Vuetify 4.2, Vite 8.2, Ajv 8.20, and Vitest 5.0 packages; no additions

**Storage**: Version-controlled JSON under `webapp/src/content`; raw game extraction remains in a unique temporary path outside the repository

**Testing**: Vitest unit and content-validation suites, ESLint, Prettier, TypeScript/Vue type checking, Vite production build, deterministic-build and bundle-validation scripts

**Target Platform**: Static evergreen-browser application published through the existing CloudFront architecture

**Project Type**: Static web application plus build-time content extraction and normalization tooling

**Performance Goals**: Keep fixed values and rarity sequences responsive at 320 CSS pixels and avoid runtime parsing of source binaries

**Constraints**: No new dependency, database, server-side runtime, AWS mutation, raw dump, game binary, or unauthorized media; only English and German banner descriptions are copied under the user's explicit authorization

**Scale/Scope**: 97 active banners, 9 towers, two supported locales, 66 tower-specific effect records, and 60 fixed effect records

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

- **Static-first architecture**: PASS. All published content remains checked-in JSON and the browser receives no extraction or parsing code.
- **Data ownership and provenance**: PASS. `webapp/` owns schemas, generation, content, and tests; build `23261523`, source asset, path ID, localization languages, extractor versions, and parse status remain recorded.
- **No database or runtime persistence**: PASS. No service or storage layer is introduced.
- **Dependency approval**: PASS. The design uses existing platform APIs and dependencies only.
- **Security and untrusted content**: PASS. Game markup is converted to plain text during generation and never passed to an HTML rendering directive.
- **Accessibility**: PASS. Tower-specific rarity has visible text, screen-reader labels, WCAG-AA foreground colors, and non-breaking sequences; fixed values expose no false rarity identity.
- **Testing and deterministic builds**: PASS. Binary decoding, cleanup, formatting, schema validation, localization, accessibility semantics, responsive CSS, version metadata, and deterministic output are covered.
- **Copyright and repository hygiene**: PASS. The user's request explicitly authorizes the two banner-description languages; raw dumps and all other game material remain outside the repository.
- **Infrastructure boundary**: PASS. No `infra/` or AWS resource changes are required.

Post-design re-check: PASS. The contract keeps strict `additionalProperties: false` validation, the model contains only source facts required by the UI, and the extraction adapter fails on unknown or incomplete layouts.

## Project Structure

### Documentation (this feature)

```text
specs/002-banner-effect-details/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── wiki-content.schema.json
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
webapp/
├── package.json
├── package-lock.json
├── public/release.json
├── scripts/
│   ├── extract-banner-effects.ts
│   ├── generate-initial-content.ts
│   ├── normalize-game-data.ts
│   └── check-contract-sync.ts
├── src/
│   ├── app/bannerEffects.ts
│   ├── app/bannerEligibility.ts
│   ├── components/BannerCard.vue
│   ├── content/schemas/wiki-content.schema.json
│   ├── content/wiki-content.json
│   ├── generated/release.ts
│   ├── i18n/messages/en.json
│   ├── i18n/messages/de.json
│   ├── pages/TowerDetailPage.vue
│   ├── theme/tokens.css
│   └── types/content.ts
└── tests/
    ├── unit/content-validation.spec.ts
    ├── unit/banner-effects.spec.ts
    └── unit/banner-eligibility.spec.ts
```

**Structure Decision**: Extend the existing `webapp/` content pipeline and component model. Source-only binary parsing belongs in `scripts/`; browser-safe formatting belongs in `src/app/`; the feature contract is canonical under the active specification and mirrored into the application schema.

## Complexity Tracking

No constitutional violations require justification.
