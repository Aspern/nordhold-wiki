# Game-Data Refresh Contract

## Purpose

This contract defines the on-demand maintainer workflow that turns a recorded
local Nordhold Steam build into reviewable normalized wiki facts. It is not part
of routine application CI and does not publish or modify the game installation.

## Preconditions

- The maintainer has lawful local access to Nordhold Steam app `3028310`.
- Explicit dependency approval has been recorded before installing or changing
  `UnityPy` or `TypeTreeGeneratorAPI`.
- The extractor runs in an isolated Python environment and reads only the paths
  allowed by the `nordhold-game-data` skill.
- The working branch is dedicated to the content refresh.
- Raw output is written outside the repository or into an ignored temporary
  directory whose resolved path is verified before use.

## Inputs

| Input                       | Required behavior                                                           |
| --------------------------- | --------------------------------------------------------------------------- |
| Steam manifest              | Supplies the app ID, build ID, installation directory, and update evidence. |
| `resources.assets`          | Supplies the readable ability/banner records and localization references.   |
| `level2`                    | Supplies runtime banner-manager lists and eligibility relationships.        |
| IL2CPP metadata and binary  | Supply typetree information required for safe object decoding.              |
| Approved extractor versions | Are captured exactly in provenance.                                         |
| Checked-in stable ID map    | Preserves public IDs across refreshes.                                      |
| Existing editorial fields   | Are retained by stable ID unless a reviewer changes them.                   |

## Read-Only Extraction

The reusable extractor must:

1. Resolve and record the installed build before parsing.
2. Confirm required files exist and are readable.
3. Use generated typetrees before object decoding.
4. Enumerate tower, banner, runtime manager, and localization records.
5. Preserve Unity path IDs as decimal strings.
6. Capture parse failures and uncertainty explicitly.
7. Never write to Steam directories or export media, audio, bulk text, binaries,
   or object dumps into the repository.

Any partial parse is a diagnostic result, not publishable content.

## Normalization

`webapp/scripts/normalize-game-data.ts` consumes the raw interchange file and:

1. Verifies the app/build/tool identity and rejects parse errors.
2. Resolves current and aliased source keys through `id-map.json`.
3. Excludes obsolete records and deduplicates repeated source definitions using
   reviewed internal identity, never display title alone.
4. Classifies each banner exactly once as `tower-specific`, `generalist`,
   `unique`, or `fusion` using direct records and runtime references.
5. Derives every tower/banner relationship from active banner-manager evidence.
6. Merges source facts with existing independently worded summaries and visual
   metadata by stable ID.
7. Writes canonical arrays and object keys so identical factual inputs and tool
   versions produce byte-identical normalized facts.
8. Writes a provenance record for every tower, banner, and eligibility pair.

Generation time is recorded only in provenance metadata and is excluded when
comparing deterministic fact output.

Before editorial completion, `webapp/scripts/generate-content-checklist.ts`
creates `content-inventory.md` with one review item for every stable tower and
banner identifier found by the reviewed extraction. The checklist contains no
raw dump or bulk game text; it tracks only the stable identifier and the required
completion/review fields. Tower and banner items may then be completed in
parallel, but normalization cannot pass until every item is resolved.

## Editorial Completion

Normalization fails with an actionable inventory when a new or changed record
lacks:

- a required English name or alternative text, or an English/German effect
  summary;
- a reviewed banner classification or eligibility relationship;
- an authorized tower image or original CSS banner visual with authorship/license data;
- a stable ID decision; or
- complete provenance.

An unavailable German game-content name or alternative text does not fail
publication when its English fallback exists, but the validator reports every
such fallback so it cannot be mistaken for a translated value. Effect summaries
never use this exception and require both languages.

Editorial summaries must faithfully communicate extracted effects without
copying bulk source wording. Game artwork is never an automatic output of this
workflow. The initial tower sprites were imported through a separate, explicitly
authorized, build-specific operation recorded in
`webapp/src/assets/entities/towers/extraction-manifest.json`. That exception does
not authorize additional media extraction during a content refresh. Banner
visuals remain original CSS definitions.

## Validation and Review

Before normalized JSON can be committed:

- every extracted tower and banner has one completed checklist item;
- all three relevant schemas pass;
- semantic and cross-reference checks pass;
- parse errors and unresolved uncertainties are empty;
- the recorded build and engine version match the extraction evidence;
- a second normalization of the same inputs has no factual or ordering diff;
- obsolete and duplicate decisions are visible in the review report;
- no raw dumps, absolute local paths, game binaries, or unauthorized media are staged;
- a human reviews provenance, original summaries, and visual authorization.

The expected output is only normalized JSON, stable-ID changes when justified,
provenance, and a concise review report. Routine validation and production builds
must consume those checked-in outputs without Steam or Python extractor packages.

## Failure Behavior

On missing files, unknown typetrees, incomplete manager references, duplicate
identity, unclassified records, unresolved locale mappings, or validator failure,
the workflow exits non-zero and leaves the last accepted checked-in dataset
unchanged. Historical baseline counts may signal a review but must never force an
incorrect result.
