# Feature Specification: Banner Effect Details

**Feature Branch**: `feature/banner-effect-details`

**Created**: 2026-09-08

**Status**: Accepted

**Input**: User description: "Raise the application version to 1.0.0, extract the original banner texts from the game data, and present tower-specific effect numbers compactly side by side in the matching common, rare, and legendary rarity colors (for example, 2%/6%/10%). Generalist, unique, and fusion banners have no rarity-dependent values and display one number per effect."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Exact Banner Effects (Priority: P1)

As a player comparing banners, I can read the original English or German banner effect wording from the installed game build so that the wiki reflects the game's actual description instead of an editorial summary.

**Why this priority**: Exact effect wording is the primary factual improvement requested and is required before rarity values can be interpreted correctly.

**Independent Test**: Select representative tower-specific, unique, fusion, and generalist banners and compare their displayed English and German descriptions with the source localization records from the documented game build.

**Acceptance Scenarios**:

1. **Given** a published banner with English and German source descriptions, **When** a user views it in either supported language, **Then** the corresponding original localized wording is displayed without exposing game-specific formatting markup.
2. **Given** a source description containing supported emphasis or glossary markup, **When** it is imported, **Then** its visible wording and punctuation are preserved as safe plain text.
3. **Given** the complete active banner inventory, **When** content validation runs, **Then** every one of the 97 banners has source-derived English and German effect text with traceable build provenance.

---

### User Story 2 - Read Effect Values at a Glance (Priority: P2)

As a player comparing banners, I can compare a tower-specific effect's common, rare, and legendary values in one compact sequence while seeing a fixed effect from a generalist, unique, or fusion banner only once.

**Why this priority**: The compact rarity comparison turns the exact effect data into an actionable reference while preserving the wording established by User Story 1.

**Independent Test**: Open tower-specific banners with percentage, signed, time, integer, equal, and multiple-variable effects and confirm their three values appear in common/rare/legendary order. Open representative generalist, unique, and fusion banners and confirm each fixed effect value appears exactly once without rarity identity or slash separators.

**Acceptance Scenarios**:

1. **Given** an effect whose values differ by rarity, **When** its banner card is shown, **Then** the common, rare, and legendary values appear directly beside one another in that order, separated only by slashes.
2. **Given** a generalist, unique, or fusion banner effect, **When** its banner card is shown, **Then** its source value appears exactly once without slash separators or a rarity color.
3. **Given** a numeric effect with game-defined presentation flags, **When** it is displayed, **Then** signs and suffixes such as percent, seconds, or multiplier markers match the game data.
4. **Given** a user who cannot distinguish the rarity colors, **When** a tower-specific value sequence is read visually or with assistive technology, **Then** common, rare, and legendary identities remain available through non-color text or accessible labels.
5. **Given** a narrow mobile layout, **When** an effect value or sequence is rendered, **Then** it remains together and the surrounding effect details wrap without horizontal page scrolling.

---

### User Story 3 - Identify the 1.0 Release (Priority: P3)

As a visitor or release reviewer, I can see that the application identifies itself as version 1.0.0 so that the completed content milestone has a consistent release identity.

**Why this priority**: Version consistency is necessary for release traceability but does not affect interpretation of banner effects.

**Independent Test**: Inspect the visible release label and all packaged release metadata and verify that each reports version 1.0.0.

**Acceptance Scenarios**:

1. **Given** the built application, **When** release information is displayed or inspected, **Then** all application-owned version fields report `1.0.0`.

### Edge Cases

- A banner may define multiple independent effect variables; each variable must retain its own localized label and either its tower-specific rarity sequence or its fixed value.
- A tower-specific banner may use the same numeric value at two or all three rarities; the source values remain visible in all three ordered rarity positions.
- A generalist, unique, or fusion source record repeats its fixed value in three serialization slots; all three slots must agree before they are normalized to one published value.
- A source description may contain placeholder tokens for an effect value; the rendered description must not leave an unexplained raw placeholder visible.
- A value may be negative, fractional, an integer, a percentage, a duration, or a multiplier; its source-defined presentation must be preserved without avoidable trailing zeros.
- A source localization field, fixed value, or required rarity value may be missing or malformed; content generation and validation must fail rather than silently inventing a value or retaining the old editorial summary.
- Game-specific rich-text tags must never be interpreted as arbitrary HTML.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application-owned semantic version MUST be `1.0.0` everywhere it is stored, generated, validated, or displayed.
- **FR-002**: The checked-in banner dataset MUST contain the original English and German effect descriptions extracted from the active banner records and localization source for Steam build `23261523`.
- **FR-003**: Original effect descriptions MUST preserve source-visible wording and punctuation while removing game-specific formatting markup and safely resolving supported value placeholders.
- **FR-004**: Every active banner MUST contain one structured effect-value record for every source variable that contributes a displayed numeric effect.
- **FR-005**: Each structured effect-value record MUST contain a stable source key, an English and German label, formatting metadata, and exactly one value shape: common, rare, and legendary values for a tower-specific banner, or one fixed value for a generalist, unique, or fusion banner.
- **FR-006**: Numeric presentation flags from the game data, including explicit signs, percent markers, seconds, multipliers, equality-hiding metadata, and value restrictions, MUST be retained when they affect user-visible formatting.
- **FR-007**: Tower-specific banner cards MUST display effect-value records as compact common/rare/legendary sequences in that fixed order, with slash separators and no spaces around the separators.
- **FR-008**: The common, rare, and legendary numbers on tower-specific banners MUST use distinct rarity colors consistent across all banner cards.
- **FR-009**: Rarity identity MUST NOT be conveyed by color alone; each value MUST expose its rarity through accessible text, and the interface MUST provide a visible rarity key for the color mapping.
- **FR-010**: A fixed value or three-value rarity sequence MUST remain an unbroken unit while labels and descriptions may wrap responsively around it.
- **FR-011**: Content schema validation MUST reject banners with missing descriptions, missing required localizations, malformed effect variables, a value shape that does not match the banner classification, missing fixed or rarity values, unsupported formatting metadata, or unexpected properties.
- **FR-012**: The extraction and normalization workflow MUST reproducibly derive banner descriptions and values from a raw dump kept outside the repository, record build and tool provenance, and fail on incomplete or ambiguous source data.
- **FR-013**: Automated tests MUST cover source-text cleanup, binary value extraction, presentation formatting, content validation, localization, accessibility semantics, and responsive rendering behavior at the component/model boundary.
- **FR-014**: Raw extraction dumps, game binaries, artwork, audio, and localization languages outside the requested English and German banner text MUST remain outside the repository and published bundle.
- **FR-015**: Generalist, unique, and fusion banner cards MUST render exactly one fixed number per effect without slash separators, repeated values, or rarity styling.

### Key Entities

- **Banner Effect**: The source-derived English and German description for one active banner plus its ordered effect-value records.
- **Effect Value Record**: One game variable with a stable source key, localized label, classification-appropriate value shape, and formatting metadata required to reproduce its visible notation.
- **Rarity Value**: One numeric source value associated with common, rare, or legendary rarity.
- **Fixed Value**: One numeric source value shared by all serialization slots of a generalist, unique, or fusion banner effect.
- **Extraction Provenance**: The game build, Unity version, source assets, object path IDs, localization languages, extractor versions, and parse status supporting the published facts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 97 active banners display source-derived English and German effect descriptions from Steam build `23261523` with zero unresolved raw formatting tags or placeholders.
- **SC-002**: For every extracted tower-specific effect variable, 100% of common, rare, and legendary values shown in the wiki match the source binary data; for every other extracted effect variable, its one displayed value matches all identical source slots and appears exactly once.
- **SC-003**: In representative desktop and 320-pixel-wide layouts, 100% of fixed values and three-value sequences remain together without causing horizontal page scrolling.
- **SC-004**: Keyboard and screen-reader inspection identifies all three rarities on tower-specific sequences without relying on color, and the three rarity colors meet WCAG 2.2 AA contrast against the banner-card background; fixed values expose no false rarity identity.
- **SC-005**: All application-owned version metadata and the visible release label report `1.0.0` after generation and build validation.
- **SC-006**: The complete local validation suite, content contracts, production build, deterministic-build check, and bundle validation complete successfully with no raw extraction dump included in version control or build output.

## Assumptions

- The user's request for original banner texts explicitly authorizes publication of the English and German effect descriptions for the active banner inventory in this feature; no other copied game text or media is authorized.
- "Normal" rarity in the request corresponds to the game's `Common` rarity, followed by `Rare` and `Legendary`.
- The common, rare, and legendary serialization slots for every generalist, unique, and fusion effect are identical in build `23261523`; generation fails if a future build violates this invariant instead of choosing one slot silently.
- Rarity colors use the existing visual language extended with a neutral common color, blue rare color, and gold legendary color; accessible labels and a visible key supplement the colors.
- Banner titles, classifications, eligibility, tower data, and banner visuals remain unchanged except where documentation must describe the new effect model.
- The installed Steam build remains `23261523`, matching the currently published dataset.
