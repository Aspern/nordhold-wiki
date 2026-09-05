# Implementation Plan: Initial Wiki Platform

**Branch**: `feature/initial-wiki-platform` (planned implementation branch) | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-initial-wiki-platform/spec.md`

## Summary

Build a public, static Nordhold tower and banner wiki as a strict TypeScript Vue
single-page application. The application will use Vuetify's Material Design
components, stable tower routes, German and English localization, and validated,
version-controlled JSON generated from a reproducible local game-data workflow.
Terraform will provision a private Amazon S3 origin behind CloudFront, ACM TLS,
and narrowly scoped GitHub Actions OIDC deployment roles. GitHub Actions will
implement the required validate, build, deploy, and verify job sequence without
rebuilding the promoted application artifact. The first production run remains
disabled until implementation convergence, full validation, draft pull-request
review, and human integration of the accepted revision into `main` are complete.
A separately approved one-time bootstrap may run outside CI from the reviewed
feature revision before merge to establish state, repository-specific OIDC
roles, certificate, initial delivery-resource, and DNS prerequisites required by
the first CI plan. It reads the existing account-wide GitHub OIDC provider by
its canonical URL, does not manage that shared provider, and does not publish the
wiki application.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; Vue 3.5; Node.js 24 LTS for application tooling; HCL with Terraform 1.16.1; Python 3.13 for the read-only game-data extractor

**Primary Dependencies**: Exact candidate versions and their impact are listed in `research.md`: Vue 3.5, Vuetify 4, Vue Router 4, Vue I18n 11, Vite 8, Ajv 8, Vitest 5, ESLint 10 with compatible TypeScript/Vue integrations, Prettier 3, AWS provider 6.63.0, and `UnityPy` plus `TypeTreeGeneratorAPI` only in the maintainer's isolated extraction environment

**Storage**: Version-controlled JSON, the nine authorized tower PNG sprites, and original CSS banner visual definitions in `webapp/`; private Amazon S3 bucket for deployed artifacts; encrypted and versioned S3 Terraform state; no database or runtime persistence

**Testing**: Vitest unit tests cover functional domain requirements such as content interpretation, search, eligibility, localization, and release metadata. Schema/cross-reference validation, deterministic-generation checks, static analysis, production builds, Terraform format/validate, manual interface review, and one post-deployment HTTPS smoke check are separate quality or operational checks. No component, browser E2E, live-AWS integration, visual-regression, performance, accessibility, or broad UI/UX automated test suite is included.

**Target Platform**: Modern evergreen desktop and mobile browsers; static AWS S3 origin delivered by CloudFront at `https://nordhold.asperntallow.de`; GitHub-hosted CI runners

**Project Type**: Static web application plus Terraform infrastructure and CI/CD automation

**Performance Goals**: No explicit performance SLA or KPI is part of the initial feature. The static architecture and cacheable fingerprinted CloudFront assets provide a simple baseline; measurable performance targets may be introduced only through a later accepted requirement.

**Constraints**: No backend, database, runtime CMS, authentication, analytics, or tracking; extracted game media is limited to the nine explicitly authorized tower sprites and banners use original CSS visuals; complete English and German interface catalogues and effect summaries with English fallback for unavailable German names or alternative text; deterministic builds; centralized theme tokens; private origin; no committed secrets, account values, raw extraction dumps, or Terraform state; dependency installation and AWS mutation require explicit human approval; CI dependency setup may contact only the accepted public npm and Terraform registry/distribution endpoints

**Scale/Scope**: One public production environment, approximately 9 first-release towers and about 100 eligible banner records subject to live extraction validation, two locales, two primary page types, and one on-demand maintainer content-refresh workflow

## Constitution Check

### Pre-design gate

| Principle or gate                      | Result                        | Evidence                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification-driven scope fidelity    | PASS                          | The accepted specification and its recorded clarifications are the sole source of product scope.                                                                                                                                                                                             |
| Static content integrity               | PASS                          | The design uses checked-in JSON, explicit schemas, stable identifiers, deterministic normalization, cross-reference checks, and provenance without a runtime data service.                                                                                                                   |
| Testable and accessible experience     | PASS                          | Functional domain logic receives unit coverage; schema/content validation and static checks remain automated quality gates; semantic structure, keyboard operation, focus visibility, contrast, labels, responsive layouts, and visual direction receive documented human acceptance review. |
| Secure static delivery                 | PASS                          | Static assets are delivered through CloudFront from a private S3 origin using OAC; Terraform owns Nordhold infrastructure; repository-specific roles reference the separately managed account-wide OIDC provider and replace long-lived CI credentials.                                                                                                   |
| Simplicity and explicit change control | PASS                          | The solution remains two top-level modules, uses no backend, and limits AWS services to the static-delivery and deployment needs in the specification.                                                                                                                                       |
| Dependency approval                    | PASS WITH IMPLEMENTATION GATE | Dependencies are evaluated in `research.md`; none may be installed or committed until the human explicitly approves the proposed set.                                                                                                                                                        |
| AWS mutation approval                  | PASS WITH IMPLEMENTATION GATE | Terraform source may be prepared without approval. The one-time out-of-CI bootstrap and every later shared plan/apply or DNS change require explicit approval; bootstrap publishes no wiki release and recurring changes use the protected `main` workflow.                                  |
| Copyright and provenance               | PASS                          | The gameplay-fact extractor remains media-free; a separate user-authorized import supplies only the nine exact tower sprites with a build-specific manifest, while banner visuals are original deterministic CSS.                                                                            |

### Post-design re-check

The Phase 1 data model and contracts preserve every pre-design result. The data
contracts separate confirmed extracted facts from editorial summaries and visual
metadata, route inputs are constrained to validated stable identifiers, and the
CI contract prevents pull-request deployment. No constitutional exception is
required. Dependency approval, human interface/visual acceptance, the one-time
bootstrap approval, pull-request review, and protected production approval remain
explicit lifecycle gates rather than unresolved product requirements.

## Project Structure

### Documentation (this feature)

```text
specs/001-initial-wiki-platform/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- content-inventory.md      # Generated during the implementation refresh
|-- manual-review.md          # Completed human interface/visual acceptance
|-- contracts/
|   |-- ci-cd.md
|   |-- game-data-refresh.md
|   |-- provenance.schema.json
|   |-- release-metadata.schema.json
|   |-- routes.md
|   |-- stable-id-map.schema.json
|   `-- wiki-content.schema.json
`-- tasks.md
```

### Source Code (repository root)

```text
webapp/
|-- package.json
|-- package-lock.json
|-- vite.config.ts
|-- eslint.config.ts
|-- src/
|   |-- app/
|   |-- components/
|   |-- content/
|   |   |-- id-map.json
|   |   |-- provenance.json
|   |   `-- wiki-content.json
|   |-- i18n/
|   |   |-- messages/de.json
|   |   `-- messages/en.json
|   |-- pages/
|   |-- router/
|   |-- theme/
|   |-- types/
|   `-- assets/entities/
|       |-- banners/
|       `-- towers/
|-- scripts/
|   |-- generate-content-checklist.ts
|   |-- generate-release-metadata.ts
|   |-- normalize-game-data.ts
|   `-- validate-content.ts
`-- tests/
    |-- fixtures/
    `-- unit/

infra/
|-- bootstrap/
|   |-- certificate.tf
|   |-- iam.tf
|   |-- main.tf
|   |-- outputs.tf
|   |-- state.tf
|   |-- variables.tf
|   `-- versions.tf
|-- production/
|   |-- functions/
|   |-- backend.tf
|   |-- cloudfront.tf
|   |-- outputs.tf
|   |-- providers.tf
|   |-- s3.tf
|   |-- variables.tf
|   `-- versions.tf
`-- README.md

.github/workflows/
`-- wiki-platform.yml
```

**Structure Decision**: Keep the repository's required `webapp/` and `infra/`
ownership boundary. The web application owns content, schemas copied from the
feature contracts, normalization, build metadata, presentation, and functional
unit tests. Infrastructure owns bootstrap and production Terraform plus static
validation. The single workflow orchestrates both modules without placing
application behavior in Terraform or cloud behavior in the application.

## Phase 0: Research Outcomes

The technology, data-extraction, static hosting, routing, security, and CI
decisions are recorded with alternatives and primary sources in `research.md`.
All technical unknowns from the specification have been resolved. Live content
inventory is deliberately deferred to implementation because its approved
extractor dependencies are not installed in the current environment.

## Phase 1: Design Outcomes

- `data-model.md` defines tower, banner, eligibility, localization, visual,
  provenance, release, and stable-ID rules plus their validation lifecycle.
- `contracts/wiki-content.schema.json`, `contracts/provenance.schema.json`,
  `contracts/stable-id-map.schema.json`, and
  `contracts/release-metadata.schema.json` define machine-readable boundaries.
- `contracts/routes.md` defines public route and static-host rewrite behavior.
- `contracts/game-data-refresh.md` defines the reproducible, read-only extraction
  and editorial-completion boundary.
- `contracts/ci-cd.md` defines the exact jobs, artifacts, approvals, and promotion
  rules for validate, build, deploy, and verify.
- `quickstart.md` defines local validation and the explicitly gated deployment and
  data-refresh paths.

No unresolved specification clarification marker remains. Phase 2 task
generation is represented by `tasks.md`.
