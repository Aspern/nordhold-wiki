# Feature Specification: Initial Nordhold Wiki Platform

**Feature Branch**: `feature/initial-wiki-platform` (planned; branch hook not configured)

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Create the initial public Nordhold wiki for browsing and searching towers and every banner available to a selected tower, with English and German localization, reproducible game-derived static content, authorized exact tower icons, original CSS-rendered banner visuals, AWS-hosted delivery at nordhold.asperntallow.de, and a validated build-and-release workflow."

## Clarifications

### Session 2026-09-05

- Q: Which information must the first release show for each tower and banner? → A: Localized names, recognizable visuals, classifications, and concise localized effect summaries.
- Q: When should the static tower and banner dataset be regenerated from an installed Nordhold build? → A: On demand by a maintainer for an intentional game-data update; commit only normalized JSON and provenance.
- Q: Should each tower's banner view have a stable URL that visitors can bookmark and open directly? → A: Yes; use a stable path based on the tower identifier and support direct page loads.
- Q: May the first production release use generic themed fallback visuals when an original tower or banner visual is missing? → A: No; every published tower and banner requires its own recognizable original or authorized visual.
- Q: How should tower-specific, generalist, unique, and fusion labels organize banners in the wiki? → A: Use four mutually exclusive groups and assign every banner to exactly one group.

- Q: Which external dependency endpoints may routine CI contact? → A: CI may access the public npm registry for dependency installation and `npm audit`, and the public Terraform Registry and provider distribution endpoints for locked Terraform provider installation.
- Q: Which automated tests belong in the initial feature? → A: Only unit tests for functional domain requirements are automated; formatting, static analysis, schema/content validation, builds, Terraform validation, and the required post-deployment smoke check remain quality or operational checks rather than automated test suites.
- Q: How are the visual-design requirements accepted? → A: A human reviewer confirms them after implementation, and the visuals are refined iteratively when the review identifies deficiencies.
- Q: When may the first production release run? → A: Only after implementation convergence and full validation are complete, a draft pull request has been reviewed, and the accepted change has been integrated into `main` by a human.
- Q: How are AWS prerequisites created before the first CI infrastructure plan can run? → A: A one-time, explicitly approved bootstrap may run outside CI from the reviewed feature revision to establish remote state, repository-specific OIDC roles that reference the existing account-wide GitHub provider, certificate validation, initial static-delivery resources, and required one.com DNS records. It MUST NOT create or manage another GitHub OIDC provider or publish a wiki release; after bootstrap, recurring infrastructure changes and application releases run only through the approved `main` workflow.
- Q: How are entity visuals supplied after the project owner authorized exact tower sprites and requested CSS-built banners? → A: The nine exact tower sprites are extracted once from the owner's local installation into the repository with a build-specific authorization manifest; every banner uses its own original deterministic CSS visual definition and no extracted banner artwork.
- Q: How are infrastructure application and application publication separated in CI? → A: The deploy stage uses a dedicated `infra:apply` job that runs only for `main` and applies the retained Terraform plan, followed by an `app:deploy` job that publishes the retained web bundle without applying Terraform.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Discover and Search Towers (Priority: P1)

As a visitor, I can open the public wiki and see every active Nordhold tower as a recognizable visual item so that I can quickly find a tower without already knowing its exact name.

**Why this priority**: The tower catalogue is the entry point to all wiki content and provides useful value even before banner details are available.

**Independent Test**: Load the tower catalogue using the accepted game-derived fixture, verify that every active tower appears once, and search by a full name, a partial name, different letter casing, surrounding whitespace, and a term with no match.

**Acceptance Scenarios**:

1. **Given** the wiki contains a validated tower catalogue, **When** a visitor opens the site, **Then** every active tower is visible once with its localized name, correct visual identifier, and concise localized effect summary.
2. **Given** the catalogue is displayed, **When** the visitor enters part of a tower's localized name, **Then** only matching towers remain visible and the result changes without a page reload.
3. **Given** a search has no matching tower, **When** the results are shown, **Then** the visitor sees a localized no-results message and can clear the search.
4. **Given** a visitor clears the search or enters only whitespace, **When** the catalogue updates, **Then** all towers are visible again.

---

### User Story 2 - Explore Every Banner for a Tower (Priority: P1)

As a visitor, I can select a tower and see every active banner that the tower can receive, including tower-specific, generalist, unique, and fusion banners, so that I can understand all available build choices.

**Why this priority**: Showing the complete banner set for a selected tower is the wiki's core knowledge outcome.

**Independent Test**: Select each tower in a validated fixture and compare the displayed banner identifiers and classifications with the eligibility relationships in that fixture, including banners eligible for multiple towers and banners intentionally excluded as obsolete.

**Acceptance Scenarios**:

1. **Given** the visitor is viewing the tower catalogue, **When** the visitor selects a tower, **Then** the selected tower and all active banners eligible for it are displayed with concise localized effect summaries.
2. **Given** eligible banners span multiple classifications, **When** the banner view is displayed, **Then** each banner appears in exactly one of the tower-specific, generalist, unique, or fusion groups and no eligible group is omitted.
3. **Given** an obsolete, duplicate, or ineligible banner record exists in source data, **When** the visitor views a tower, **Then** that record is not presented as an available banner for the tower.
4. **Given** the visitor is viewing a tower's banners, **When** the visitor returns to the tower catalogue, **Then** the catalogue is available without restarting the visit.
5. **Given** a visitor opens a valid saved tower URL directly, **When** the wiki loads, **Then** the matching tower and its eligible banners are displayed without first visiting the catalogue.
6. **Given** a visitor opens a tower URL containing an unknown identifier, **When** the wiki loads, **Then** a localized not-found state provides a way back to the tower catalogue.

---

### User Story 3 - Search Within Eligible Banners (Priority: P2)

As a visitor, I can search the selected tower's eligible banners by localized name so that I can find a known banner in a large list.

**Why this priority**: Banner search improves the main exploration flow but depends on the tower and banner catalogue already being present.

**Independent Test**: For a selected tower with banners from multiple classifications, search by full and partial localized names, different letter casing, surrounding whitespace, and a term with no match; verify that ineligible banners never enter the result.

**Acceptance Scenarios**:

1. **Given** a selected tower has eligible banners, **When** the visitor enters part of a banner's localized name, **Then** matching eligible banners are shown without a page reload.
2. **Given** no eligible banner matches the search, **When** the results are shown, **Then** a localized no-results message is displayed and the search can be cleared.
3. **Given** the banner search is empty or contains only whitespace, **When** the list updates, **Then** every eligible banner for the selected tower is shown.

---

### User Story 4 - Use the Wiki in the Visitor's Language (Priority: P2)

As an English- or German-speaking visitor, I see the wiki in the appropriate language automatically so that I can understand navigation and game information without configuring the site first.

**Why this priority**: Localization makes the core content useful to both intended language audiences and prevents language-specific text from becoming embedded in the interface.

**Independent Test**: Open a fresh visit with German, English, and unsupported browser-language preferences and verify the selected language and all visible interface messages against the localization catalogue.

**Acceptance Scenarios**:

1. **Given** German is the visitor's highest supported browser language, **When** the wiki opens, **Then** all available interface text and localized game content are shown in German.
2. **Given** English is the visitor's highest supported browser language, **When** the wiki opens, **Then** all available interface text and localized game content are shown in English.
3. **Given** none of the visitor's preferred browser languages is supported, **When** the wiki opens, **Then** English is used as the fallback language.
4. **Given** a required translation key is missing, **When** the affected content is rendered, **Then** the English value is used and the page remains usable without exposing a raw translation key.

---

### User Story 5 - Identify the Published Wiki Release (Priority: P2)

As a visitor, I can identify the wiki and its published release from every main view so that I know which version and publication date I am consulting.

**Why this priority**: Visible release information makes static content updates traceable and helps users and maintainers discuss a specific publication.

**Independent Test**: Build a release with known release metadata, open the tower and banner views, and verify the title, attribution, version, and localized build date shown in the header.

**Acceptance Scenarios**:

1. **Given** a valid release is displayed, **When** the visitor views the header, **Then** it contains the Nordhold Wiki title, a small "Powered by Aspern Tallow" attribution, the declared application version, and the date on which that release was built.
2. **Given** the visitor moves between the tower and banner views, **When** the header is displayed, **Then** the same release information remains available at the right side of the header on layouts with sufficient width and remains readable on smaller layouts.
3. **Given** the calendar date changes after a release was built, **When** the visitor reloads the unchanged release, **Then** the displayed build date remains the release's build date rather than the current visit date.

---

### User Story 6 - Publish a Verified Release (Priority: P3)

As a maintainer, I can validate, build, approve, deploy, and verify a release through a traceable workflow so that the public wiki can be updated reliably without placing credentials or manually assembled content in the repository.

**Why this priority**: Public delivery is required for the target outcome but can be developed and reviewed after the static application and content behavior are independently demonstrable.

**Independent Test**: Run the workflow against a non-mutating fixture or isolated environment, verify stage and job ordering and artifacts, then exercise the production deployment only after the required human approval and confirm the HTTPS smoke check.

**Acceptance Scenarios**:

1. **Given** a proposed change, **When** validation runs, **Then** application quality, formatting, dependency security, unit tests, and infrastructure configuration are checked and reported before build work can pass.
2. **Given** validation succeeds, **When** build runs, **Then** a versioned deployable web bundle and a reviewable infrastructure change plan are produced.
3. **Given** a release from the integration branch has passed prior stages and a human authorizes shared AWS mutation, **When** deploy runs, **Then** the approved infrastructure changes and exact web bundle are published.
4. **Given** deployment succeeds, **When** verification runs, **Then** the public HTTPS domain is checked and the release fails if the wiki cannot be reached successfully.
5. **Given** a pull request or an unapproved run, **When** the workflow executes, **Then** it performs no infrastructure apply and publishes no production application assets.

### Edge Cases

- The source extraction returns zero towers, a tower without a stable identifier, a banner without exactly one valid normalized classification, or an eligibility reference to an unknown record; validation fails rather than publishing incomplete content.
- A game build contains obsolete or duplicate banner definitions; only definitions proven active through the build's runtime references are eligible for publication.
- A tower legitimately has no banners in one classification; the interface does not imply missing data and still shows other eligible classifications.
- Search input includes mixed case, leading or trailing whitespace, German characters, punctuation, or no matches; filtering remains predictable and does not expose an error.
- A localized game term is unavailable in the requested language; the English value is used and the missing translation remains detectable during content validation.
- A direct tower URL contains an unknown or malformed stable identifier; the visitor sees a localized not-found state and can return to the catalogue.
- A required individual visual is missing or lacks its required authorship or authorization evidence; production validation fails rather than publishing a generic fallback, unauthorized game asset, or broken visual.
- Release metadata is missing or malformed; the production build fails rather than publishing an unknown version or date.
- The one.com DNS record or certificate validation is incomplete; deployment does not report success and verification identifies the unreachable or untrusted domain.
- Cached visitors request a previous release after deployment; the delivery design preserves valid application entry points and provides a documented cache invalidation and rollback path.
- A cloud service does not support resource tags; the exception is documented while all taggable resources retain the required project and environment identity.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The wiki MUST be publicly reachable without authentication at `https://nordhold.asperntallow.de` after production release.
- **FR-002**: The wiki MUST provide a catalogue containing every active tower in the accepted source game build exactly once.
- **FR-003**: Each tower catalogue item MUST expose a stable identifier, localized display name, concise localized effect summary, and visual identifier that accurately belongs to that tower.
- **FR-004**: Visitors MUST be able to filter towers by a case-insensitive substring of the displayed localized name; surrounding whitespace MUST be ignored, an empty search MUST show all towers, and no match MUST produce a localized empty state.
- **FR-005**: Visitors MUST be able to select a tower, bookmark a stable path derived from its language-independent stable identifier, open that path directly, and return from its banner view to the complete tower catalogue.
- **FR-006**: For a selected tower, the wiki MUST show every active banner that the accepted dataset marks as eligible for that tower and MUST show no banner that is ineligible, obsolete, or duplicated.
- **FR-007**: The selected tower's banner set MUST use the four mutually exclusive normalized classifications `tower-specific`, `generalist`, `unique`, and `fusion`; every banner MUST be assigned to exactly one classification and displayed in only that group.
- **FR-008**: Each displayed banner MUST expose a stable identifier, localized display name, concise localized effect summary, exactly one normalized game-derived classification, correct tower-eligibility relationship, and visual identifier that accurately belongs to that banner.
- **FR-009**: Visitors MUST be able to filter the selected tower's banners by a case-insensitive substring of the displayed localized name; surrounding whitespace MUST be ignored, an empty search MUST show all eligible banners, and no match MUST produce a localized empty state.
- **FR-010**: All wiki interface text MUST be localizable and MUST initially be supplied in English and German.
- **FR-011**: On a fresh visit, the wiki MUST choose the first supported language from the visitor's ordered browser preferences and MUST use English when no preferred language is supported.
- **FR-012**: Missing German content MUST fall back to English without displaying raw localization identifiers to visitors, and missing required English fallback content MUST fail content validation.
- **FR-013**: Every main view MUST show a header containing the title "Nordhold Wiki", a subordinate "Powered by Aspern Tallow" attribution, the application release version, and the release build date.
- **FR-014**: The displayed release version MUST equal the version declared by the web application's package metadata for the published artifact.
- **FR-015**: The displayed release build date MUST be captured when the artifact is built, displayed as a date appropriate to the active locale, and remain unchanged at runtime for that artifact.
- **FR-016**: The visual design MUST be a modern, cohesive interpretation of Nordhold's atmosphere while remaining visually distinct from the game interface.
- **FR-017**: Every published tower and banner MUST have its own recognizable visual mapped to the correct entity. Towers MUST use the nine exact PNG sprites explicitly authorized by the project owner and recorded in a build-specific extraction manifest. Banners MUST use distinct original deterministic CSS visuals and MUST NOT use extracted game artwork. Production validation MUST fail when a required visual or its authorship/authorization evidence is absent. A human reviewer MUST confirm recognizability, correct mapping, authorization, and consistency with the intended modern visual direction before production release; rejected visuals MUST be revised and reviewed again.
- **FR-018**: Colors, typography, spacing, elevation, and comparable visual tokens MUST come from one shared theme so that visual-system changes can be made consistently without view-specific hard-coded values.
- **FR-019**: The tower and banner flows MUST support keyboard operation, visible focus, programmatically associated search labels, semantic headings and landmarks, readable responsive layouts, text alternatives for meaningful visuals, and WCAG 2.2 AA contrast for text and interactive controls. Formal accessibility certification and exhaustive accessibility testing are outside this feature's scope.
- **FR-020**: Wiki facts MUST be stored as version-controlled static content and MUST be usable without a database, runtime application server, or runtime content-management system.
- **FR-021**: Tower, banner, localization, classification, eligibility, and provenance records MUST have explicit validation rules, stable identifiers, and automatically checked cross-references before release.
- **FR-022**: For an intentional game-data update, a maintainer MUST run the repository's read-only Nordhold game-data extraction workflow on demand against a recorded local Steam build; only normalized JSON and provenance MAY be committed, and hand-edited replacement facts MUST NOT bypass that reproducible source process.
- **FR-023**: Content provenance MUST record the Steam build identifier, Unity version, source asset, source object path identifier, internal key, localization language, extraction tool versions, parse errors, generation time, and unresolved uncertainty needed to review each generated dataset.
- **FR-024**: Banner publication MUST follow active runtime banner-manager references rather than raw asset presence, and the normalization process MUST exclude obsolete and duplicate definitions without forcing counts to a historical baseline.
- **FR-025**: Raw extraction dumps, game binaries, audio, unauthorized artwork, and bulk copyrighted game text MUST remain outside the repository and published site. The only approved extracted artwork is the nine tower sprites covered by the recorded project-owner authorization; banner visuals are original CSS. Required effect summaries MUST faithfully represent extracted facts in independently worded English and German text unless source wording is explicitly authorized.
- **FR-026**: Repeating content generation against the same source build and extraction-tool versions MUST produce the same normalized wiki facts and ordering, excluding explicitly recorded generation metadata.
- **FR-027**: The public site MUST be delivered as static assets through a content-delivery layer using HTTPS and a non-publicly-writable origin with least-privilege access.
- **FR-028**: Direct requests to the public domain over HTTP MUST be redirected to HTTPS, and the delivered certificate MUST be valid for `nordhold.asperntallow.de`.
- **FR-029**: AWS infrastructure configuration MUST define all recurring project cloud resources and policies. A documented, human-assisted, explicitly approved bootstrap MAY run outside CI once to establish remote state, repository-specific OIDC roles, certificate validation, the initial static-delivery resources, and one.com DNS records needed before the first CI plan. The bootstrap MUST reference the existing account-wide GitHub OIDC provider by its canonical URL and MUST NOT create, modify, or destroy that shared provider or publish a wiki release. After bootstrap, recurring infrastructure changes and application releases MUST run through the approved `main` workflow.
- **FR-030**: No AWS credential, secret, account-specific secret value, private key, generated state file, or infrastructure plan file MUST be committed to the repository or embedded in the published bundle.
- **FR-031**: Every managed cloud resource that supports tags MUST carry consistent project, environment, management, and cost-attribution tags; unsupported tagging exceptions MUST be documented.
- **FR-032**: Infrastructure state location, locking where supported, environment separation, deployment behavior, cache behavior, rollback, and recovery steps MUST be documented before any shared infrastructure is applied.
- **FR-033**: The delivery workflow MUST expose the ordered stages `validate`, `build`, `deploy`, and `verify`, and a later stage MUST NOT run successfully when a required earlier stage fails.
- **FR-034**: The `validate` stage MUST contain jobs named `infra:validate` and `app:validate`.
- **FR-035**: `infra:validate` MUST check infrastructure formatting and configuration validity without contacting or changing deployed resources.
- **FR-036**: `app:validate` MUST run application static analysis, formatting verification, dependency security audit, and unit tests, and MUST publish clear pass/fail reporting for each check.
- **FR-037**: The `build` stage MUST contain jobs named `app:build` and `infra:plan`.
- **FR-038**: `app:build` MUST create a production-ready, version-identifiable deployment bundle from the exact validated revision and retain it for the later deployment job.
- **FR-039**: `infra:plan` MUST create a fresh, reviewable infrastructure change plan for the target environment without applying it and MUST retain the plan securely for the approved release flow.
- **FR-040**: The `deploy` stage MUST contain a job named `infra:apply` that applies the approved infrastructure plan and a later job named `app:deploy` that publishes the exact bundle produced by `app:build` without rebuilding it or applying Terraform.
- **FR-041**: `infra:apply` and `app:deploy` MUST run only for an approved production release from the `main` integration branch and MUST never run for pull requests. `infra:apply` MUST require explicit human authorization before shared AWS mutation, and `app:deploy` MUST run only after that exact infrastructure apply succeeds.
- **FR-042**: The `verify` stage MUST contain a job named `infra:verify` that performs a smoke check against the public HTTPS domain and fails when the wiki entry point is unreachable, untrusted, or does not identify the deployed version.
- **FR-043**: Deployment automation MUST use externally managed credentials with least privilege and MUST provide traceability from validation results through the built artifact, infrastructure plan, deployment, and smoke-test result.
- **FR-044**: Automated tests in this feature MUST be limited to unit tests for functional domain requirements. Formatting, static analysis, schema and content validation, production builds, Terraform validation, and the required post-deployment smoke check MUST remain separate quality or operational checks. Component, browser end-to-end, live AWS integration, visual-regression, performance, accessibility, and broad UI/UX automated test suites MUST NOT be added in this feature.
- **FR-045**: Routine application validation, build, and release jobs MUST consume the committed normalized dataset and MUST NOT require Steam, an installed game, extraction dependencies, or a raw extraction dump.
- **FR-046**: The static delivery configuration MUST support direct loading of every valid stable tower path; an unknown or malformed tower identifier MUST produce a localized not-found state rather than a broken or blank application.

### Mandated Solution Constraints

- **SCON-001**: The web application is constrained to Vue, a Vue-compatible Material Design component framework satisfying the requested Vue Material approach, and TypeScript throughout application and test source.
- **SCON-002**: Internationalization MUST be handled through a shared i18n mechanism rather than duplicated conditional text in views.
- **SCON-003**: Application static analysis and formatting MUST use ESLint and Prettier with current, mutually compatible configurations selected during planning.
- **SCON-004**: AWS resources MUST be described and managed with Terraform, and the public static application MUST be delivered through Amazon CloudFront.
- **SCON-005**: Routine CI MAY access the public npm registry for locked dependency installation and `npm audit`, and the public Terraform Registry and provider distribution endpoints for locked Terraform provider installation. Functional unit tests and local validators MUST otherwise use committed fixtures and MUST NOT depend on external network access.
- **SCON-006**: Selecting or installing any third-party dependency, including the exact Material component and i18n packages, requires explicit human approval after planning documents its security, maintenance, compatibility, and bundle-size impact.

### Key Entities

- **Tower**: An active tower from a specific game build, identified by a stable wiki identifier and source key, with localized names and concise effect summaries, an independently created visual reference, ordering information, banner-eligibility relationships, and provenance.
- **Banner**: An active banner from a specific game build, identified by a stable wiki identifier and source key, with localized names and concise effect summaries, exactly one normalized classification (`tower-specific`, `generalist`, `unique`, or `fusion`), an independently created visual reference, tower eligibility, and provenance.
- **Banner Eligibility**: A validated relationship between a tower and banner proving that the banner may be received by that tower in the source build; it retains the evidence needed to distinguish active relationships from raw, obsolete assets.
- **Localization Entry**: An English or German value keyed to a stable interface or game-content identifier, including whether the value was sourced, independently summarized, or supplied as a fallback.
- **Content Provenance**: Review data for a generated dataset, including source build, engine version, asset and object identifiers, internal keys, languages, tool versions, parse outcomes, uncertainty, and generation metadata.
- **Release Metadata**: The application version and artifact build date embedded in one publishable release and shown consistently to visitors.
- **Deployment Artifact**: The immutable, version-identifiable static bundle produced from a validated revision and promoted through deployment and verification without rebuilding.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For the accepted source build, 100% of active towers appear exactly once in the catalogue and 100% of obsolete tower records are absent.
- **SC-002**: For every tower in the accepted validation dataset, the displayed banner identifiers match 100% of its validated active eligibility relationships, with zero ineligible, obsolete, or duplicate banners shown.
- **SC-005**: In automated language checks, 100% of required interface messages render in English and German, German is selected for a German-first browser preference, and English is selected for unsupported preferences.
- **SC-006**: In every published release, the header version exactly matches the release's declared application version and the header date exactly matches that artifact's recorded build date across all main views.
- **SC-007**: Two consecutive normalizations of the same source build with the same extraction-tool versions yield identical ordered tower, banner, localization, and eligibility facts, excluding explicitly identified generation metadata.
- **SC-008**: The production entry point is reachable over trusted HTTPS at the required domain and identifies the just-deployed version before the release workflow reports success.
- **SC-009**: 100% of required workflow jobs run in the specified stage order for an eligible release, each required quality check has an attributable result, and failed prerequisite jobs prevent later mutation or success.
- **SC-010**: Pull-request workflow configuration and release records demonstrate zero production deployments and zero shared-infrastructure changes from pull requests, while production deployment records always include the required human authorization.
- **SC-011**: Automated and manual acceptance checks find zero committed credentials, secrets, state files, raw extraction dumps, unauthorized game assets, or unapproved bulk game text in the release revision and public bundle.
- **SC-012**: The primary tower selection, tower search, banner search, and return flows can be completed entirely by keyboard with visible focus, associated labels, meaningful structure, and no critical contrast failure.
- **SC-013**: Every published tower and banner has a concise English and German effect summary that passes factual review against the accepted extracted facts and contains no unauthorized copied game description.
- **SC-014**: Every valid tower identifier in the accepted dataset has exactly one bookmarkable path that succeeds on direct load, and all tested unknown identifiers produce the localized not-found state with a working return to the catalogue.
- **SC-015**: A documented human pre-release review confirms that 100% of published towers and banners have distinct, correctly mapped, recognizable original or authorized visuals, with zero generic fallback visuals or unauthorized game assets in the production bundle; any rejected item is revised and reviewed again before release.
- **SC-016**: 100% of published banners have exactly one of the four accepted classifications and appear exactly once within the corresponding group for every eligible selected tower.

## Assumptions

- The first release serves anonymous public visitors and maintainers; accounts, personalization, analytics, comments, content editing, and other mutable server-side behavior are outside scope.
- The initial content scope is towers and banners eligible for those towers. Abilities, enemies, maps, strategies, and broader article types are outside scope even if the extractor can discover them.
- The phrase "Vue Material" is treated as a requirement for Vue with a compatible Material Design component framework. The exact maintained package and Vue version are planning decisions subject to dependency approval, not assumptions that authorize installation.
- The project owner explicitly authorized the nine exact tower sprites extracted from the locally installed Steam build for use in this web application. The authorization and build-specific source identifiers remain reviewable in the checked-in extraction manifest.
- The production release is blocked until the authorized tower sprites and original deterministic CSS banner visuals cover every entity in the accepted dataset; generic themed fallbacks are permitted only during development and MUST NOT enter a production bundle.
- English is the canonical fallback locale. German and English game display terms may be derived from localization records, while longer descriptions are independently worded.
- The build date is the date recorded for artifact creation, not a client clock value and not necessarily the later deployment date.
- A single production domain and environment are required initially. Additional preview, staging, or regional environments are outside scope unless planning establishes them as necessary non-production validation support.
- The apex domain remains managed at one.com. Required certificate-validation and public subdomain DNS records there are documented, one-time, human-executed bootstrap steps; recurring AWS configuration and releases occur through the approved automated workflow.
- AWS account bootstrap, remote-state prerequisites, one.com access, and deployment credentials are available to authorized maintainers outside the repository before the first production release.
- The target AWS account already contains exactly one GitHub Actions OIDC provider for `https://token.actions.githubusercontent.com` with the `sts.amazonaws.com` audience. Its Terraform lifecycle remains outside this repository; Nordhold owns only its repository-scoped roles and policies.
- Accessibility is limited to the concrete essential requirements in FR-019 and SC-012; formal certification and comprehensive accessibility, visual-regression, or user-experience test programs are outside scope.
- No source extraction or AWS mutation occurs during specification. Game-data extraction follows acceptance of the content schema and runs only as an intentional maintainer-initiated content refresh, not as part of routine application CI; infrastructure apply follows explicit human authorization.
