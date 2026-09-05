# Phase 1 Data Model: Initial Wiki Platform

## Modeling Principles

- Published content is closed, validated JSON; unknown fields fail validation.
- Stable identifiers are lowercase language-independent slugs and never derive
  from a translated label or a Unity object path ID.
- Extracted facts, editorial summaries, and visual licensing metadata remain
  distinguishable and independently reviewable.
- Every entity and relationship is traceable to a provenance record.
- JavaScript-unsafe 64-bit source identifiers are decimal strings.
- Arrays use canonical source order followed by stable ID so generated changes
  remain deterministic and reviewable.

## Aggregate: Wiki Content Dataset

The content dataset is the only runtime gameplay-data input.

| Field           | Type                  | Rules                                                            |
| --------------- | --------------------- | ---------------------------------------------------------------- |
| `schemaVersion` | string                | Semantic version of the content contract; initial value `1.0.0`. |
| `gameBuildId`   | string                | Decimal Steam build ID; must equal the provenance dataset build. |
| `towers`        | `Tower[]`             | Non-empty, unique IDs and source keys, canonical order.          |
| `banners`       | `Banner[]`            | Non-empty, unique IDs and source keys, canonical order.          |
| `eligibility`   | `BannerEligibility[]` | Non-empty, unique tower/banner pairs, canonical order.           |

The machine-readable structural contract is
`contracts/wiki-content.schema.json`. Cross-aggregate rules are implemented by
the content validator because JSON Schema does not express joins cleanly.

## Entity: Tower

| Field           | Type                    | Rules                                                                     |
| --------------- | ----------------------- | ------------------------------------------------------------------------- |
| `id`            | stable ID               | Unique lowercase slug; used in `/towers/:towerId`.                        |
| `sourceKey`     | string                  | Reviewed game-internal identity key; not displayed.                       |
| `sortOrder`     | integer                 | Non-negative canonical source order.                                      |
| `name`          | `LocalizedText`         | Non-empty English name and German when available.                         |
| `effectSummary` | `RequiredLocalizedText` | Concise original English and German summaries, not a bulk game-text copy. |
| `visual`        | `ImageVisual`           | The exact authorized tower sprite and its review metadata.                |
| `provenanceRef` | provenance ID           | Resolves to one tower provenance record.                                  |

Identity is not inferred from `name`, `sortOrder`, or a Unity path ID. If a
source key changes after a game update, a maintainer explicitly updates the ID
map; the public ID remains stable unless the entity itself is replaced.

## Entity: Banner

| Field             | Type                    | Rules                                                                                             |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `id`              | stable ID               | Unique lowercase language-independent slug.                                                       |
| `sourceKey`       | string                  | Reviewed internal key; not displayed.                                                             |
| `sortOrder`       | integer                 | Non-negative canonical source order within extraction.                                            |
| `classification`  | enum                    | Exactly one of `tower-specific`, `generalist`, `unique`, or `fusion`.                             |
| `towerAffinityId` | stable ID or absent     | Required only for `tower-specific`; references its owning tower. Forbidden for all other classes. |
| `name`            | `LocalizedText`         | Non-empty English name and German when available.                                                 |
| `effectSummary`   | `RequiredLocalizedText` | Concise original English and German summaries.                                                    |
| `visual`          | `CssVisual`             | One distinct original deterministic CSS visual definition.                                        |
| `provenanceRef`   | provenance ID           | Resolves to one banner provenance record.                                                         |

Classification is normalized from reviewed runtime/source evidence. Folder or
asset presence alone is insufficient. Obsolete records are not published.

## Relationship: Banner Eligibility

| Field           | Type          | Rules                                             |
| --------------- | ------------- | ------------------------------------------------- |
| `towerId`       | stable ID     | Must resolve to a published tower.                |
| `bannerId`      | stable ID     | Must resolve to a published banner.               |
| `provenanceRef` | provenance ID | Resolves to evidence for this exact relationship. |

Each pair is unique. Every published tower has at least one eligible banner and
every published banner has at least one tower relationship. A tower-specific
banner has relationships only to its `towerAffinityId`. Generalist, unique, and
fusion eligibility reflects the runtime banner manager rather than a hard-coded
assumption that every such banner applies to every tower.

## Value Object: Localized Text

| Field | Type             | Rules                                                                       |
| ----- | ---------------- | --------------------------------------------------------------------------- |
| `en`  | string           | Required and non-empty; canonical fallback.                                 |
| `de`  | string or absent | Non-empty when present; absence is detected by validation and renders `en`. |

English is the application fallback. Application-interface catalogues have full
English/German key parity; the optional German field applies only to game-derived
entity content that is genuinely unavailable. Localized fields are rendered as
text, not HTML, and are therefore never passed to `v-html`.

## Value Object: Required Localized Text

| Field | Type   | Rules                   |
| ----- | ------ | ----------------------- |
| `en`  | string | Required and non-empty. |
| `de`  | string | Required and non-empty. |

This stricter value object is used by every tower and banner effect summary so
SC-013 is enforced even though other unavailable German game values may fall
back under FR-012.

## Visual Value Objects

Every visual carries a stable `assetId`, localized alternative text, authorship,
and a reviewable license or authorization reference. The `kind` discriminator
prevents image metadata from being confused with an original CSS definition.

### Image Visual

| Field              | Type            | Rules                                                                              |
| ------------------ | --------------- | ---------------------------------------------------------------------------------- |
| `kind`             | literal         | `image`; used only by towers in the initial dataset.                               |
| `assetId`          | stable ID       | Unique across tower and banner visuals.                                            |
| `path`             | string          | Repository-relative PNG path under `src/assets/entities/towers/`; no URL.          |
| `width`            | integer         | Positive intrinsic pixel width.                                                    |
| `height`           | integer         | Positive intrinsic pixel height.                                                   |
| `sha256`           | string          | Lowercase 64-character content digest.                                             |
| `authorship`       | literal         | `authorized`.                                                                      |
| `licenseReference` | string          | Reviewable authorship/license note or repository document reference.               |
| `alt`              | `LocalizedText` | Concise English equivalent and German when available, with the same fallback rule. |

The validator reads each referenced file, verifies its digest and dimensions,
requires a unique digest per tower, and rejects paths designated as placeholders.
The initial nine files must resolve to the checked-in build-specific extraction
manifest and its explicit project-owner authorization.

### CSS Visual

| Field              | Type            | Rules                                                 |
| ------------------ | --------------- | ----------------------------------------------------- |
| `kind`             | literal         | `css`; used only by banners in the initial dataset.   |
| `assetId`          | stable ID       | Unique across tower and banner visuals.               |
| `seed`             | integer         | Unique positive deterministic visual seed.            |
| `motif`            | enum            | One of the reviewed CSS geometry families.            |
| `authorship`       | literal         | `original`.                                           |
| `licenseReference` | string          | References the project's original CSS visual system.  |
| `alt`              | `LocalizedText` | Concise English equivalent and German when available. |

The banner component derives geometry from `seed` and `motif`; classification
colors come only from semantic theme tokens. CSS visuals require no media file,
digest, or intrinsic image dimensions. The validator requires each banner's
`assetId` and seed to be unique and rejects unrecognized motifs.

## Aggregate: Provenance Dataset

| Field           | Type                 | Rules                                                                          |
| --------------- | -------------------- | ------------------------------------------------------------------------------ |
| `schemaVersion` | string               | Version of the provenance contract.                                            |
| `datasetId`     | stable ID            | Identifies this normalized snapshot.                                           |
| `game`          | `GameBuild`          | Steam app, build, and Unity version used for extraction.                       |
| `extraction`    | `ExtractionRun`      | Tool and environment versions, UTC timestamp, parse errors, and uncertainties. |
| `records`       | `ProvenanceRecord[]` | Unique records referenced by all content facts and relationships.              |

The machine-readable contract is `contracts/provenance.schema.json`.

### Value Object: Game Build

| Field          | Type   | Rules                                                           |
| -------------- | ------ | --------------------------------------------------------------- |
| `steamAppId`   | string | Constant `3028310`.                                             |
| `buildId`      | string | Decimal build ID and exact match for `WikiContent.gameBuildId`. |
| `unityVersion` | string | Extracted engine version.                                       |

### Value Object: Extraction Run

| Field              | Type             | Rules                                                              |
| ------------------ | ---------------- | ------------------------------------------------------------------ |
| `extractor`        | string           | Repository-relative extractor identity.                            |
| `extractorVersion` | semantic version | Changes when extraction semantics change.                          |
| `pythonVersion`    | string           | Runtime version.                                                   |
| `dependencies`     | object           | Exact parser package versions.                                     |
| `generatedAt`      | UTC timestamp    | Evidence timestamp, excluded from normalized fact ordering.        |
| `parseErrors`      | string array     | Must be empty before a dataset is publishable.                     |
| `uncertainties`    | string array     | Must be empty or explicitly resolved in review before publication. |

### Entity: Provenance Record

| Field                   | Type             | Rules                                                        |
| ----------------------- | ---------------- | ------------------------------------------------------------ |
| `id`                    | provenance ID    | Unique lowercase slug.                                       |
| `entityType`            | enum             | `tower`, `banner`, or `eligibility`.                         |
| `entityId`              | string           | Matching tower/banner ID or `towerId:bannerId` pair.         |
| `evidence`              | enum             | `direct-record`, `runtime-reference`, or `localized-record`. |
| `sources`               | `SourceRecord[]` | At least one exact source reference.                         |
| `localizationLanguages` | locale array     | Unique subset of `en`, `de`.                                 |
| `notes`                 | string array     | Optional review context; no absolute machine paths.          |

### Value Object: Source Record

| Field          | Type   | Rules                                                                            |
| -------------- | ------ | -------------------------------------------------------------------------------- |
| `sourceAsset`  | string | Game-root-relative asset such as `NordHold_Data/level2`; never an absolute path. |
| `objectPathId` | string | Signed decimal Unity path ID represented as text.                                |
| `internalKey`  | string | Stable source lookup key used during normalization.                              |

## Aggregate: Stable ID Map

`webapp/src/content/id-map.json` maps source keys to public IDs and records
intentional aliases after game updates. It is maintainer-reviewed, sorted by
source key, and never generated from a translated name. Its validator enforces:

- one active source key per public entity;
- no public ID shared across entity types;
- aliases cannot point to multiple current IDs;
- every published source key resolves exactly once;
- removing or replacing a public ID requires an explicit migration decision.

## Aggregate: Release Metadata

| Field       | Type             | Rules                                             |
| ----------- | ---------------- | ------------------------------------------------- |
| `version`   | semantic version | Exact value from `webapp/package.json`.           |
| `buildDate` | date             | UTC `YYYY-MM-DD`, supplied once to the build job. |
| `commitSha` | string           | Full 40-character lowercase Git commit SHA.       |

The same generated object is used by the header and emitted as `/release.json`.
The machine-readable contract is `contracts/release-metadata.schema.json`.

## Application Read Models

### Tower Catalogue Item

Derived from one `Tower` using the active locale. It contains the stable ID,
localized name and summary, visual, and a normalized searchable name. Catalogue
order is `sortOrder` then `id` and does not change with the locale.

### Tower Detail

Derived by resolving a route ID to one tower and joining all matching eligibility
rows to banners. Banners remain grouped by the four classification values and
then ordered by `sortOrder` and `id`. The banner filter is a case-insensitive,
Unicode-normalized substring match against the active localized banner name and
does not modify eligibility.

### Search Normalization

Trim the query, normalize both query and localized name to Unicode NFC, and
apply locale-aware lowercase conversion. An empty query returns all eligible
items. Search does not perform fuzzy matching, translate terms, inspect hidden
source keys, or search the other locale.

## Validation Rules Across Files

Before test, build, or deployment:

1. Validate all JSON documents against the checked-in schemas.
2. Require globally unique stable IDs, source keys, provenance IDs, and visual
   asset IDs.
3. Resolve every tower, banner, eligibility, affinity, and provenance reference.
4. Require exactly one classification and the conditional tower affinity rule.
5. Require English names and alternative text, English and German effect
   summaries, full English/German interface-catalogue parity, and a report for
   every other game-content field that falls back from German to English.
6. Verify source build IDs agree and extraction errors are empty.
7. Verify all tower image visuals exist locally, match their digest and
   dimensions, resolve through the authorized extraction manifest, and are
   distinct. Verify all banner CSS visuals have unique IDs and seeds, approved
   motifs, original authorship, and reviewable license metadata.
8. Require every published banner and tower to participate in eligibility.
9. Require canonical ordering and byte-identical normalization for identical
   inputs.
10. Reject unrecognized fields, remote media, raw HTML, generic placeholders,
    absolute source paths, unresolved uncertainty, and obsolete records.

## Data Refresh State Transitions

```text
installed game build
    -> raw temporary extraction
    -> normalized draft
    -> editorially complete dataset
    -> schema and semantic validation
    -> reviewed version-controlled JSON
    -> immutable application build
    -> approved deployment
```

- A raw extraction may contain parser errors and uncertainty; it is never
  committed or published.
- A normalized draft may add or change stable records; it cannot advance until
  required English content, reported German fallbacks, classification,
  eligibility, visuals, and provenance are complete.
- A validated dataset may be committed for review.
- A deployment can promote only the exact immutable build artifact produced
  from the reviewed dataset.
- Failure at any transition leaves the last accepted dataset unchanged.
