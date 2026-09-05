# Game-Data Extraction Review

- **Reviewed on**: 2026-09-05
- **Steam application**: `3028310`
- **Steam build**: `23261523`
- **Unity version**: `2023.1.22f1`

## Approved extraction environment

- Python `3.13.5`
- UnityPy `1.25.3`
- TypeTreeGeneratorAPI `0.0.10`
- AssetStudio typetree backend
- Read-only inputs: `NordHold_Data/resources.assets` and
  `NordHold_Data/level2`
- Raw output was written to a verified temporary directory outside both the
  game installation and repository. It is not a repository artifact.

The extractor dependency versions exactly match the dependency matrix approved
by the human reviewer on 2026-09-05.

## Completeness result

- 1,164 selected MonoBehaviour records were parsed.
- Zero parse errors were reported.
- Zero unresolved extraction uncertainties remain.
- A second run using the extractor's updated default selectors produced the
  same ordered records, parse-error list, and exclusions; only the expected
  generation timestamp and selector-order metadata differed.
- Two `AllTowerFusionsInfo` scene objects were deliberately excluded. They are
  presentation helpers for the in-game fusion matrix and are not gameplay fact
  sources.
- Nine distinct runtime tower types were found. Ten tower instances were
  present because the Volcano Mortar tower type occurs twice in the scene; the
  normalized catalogue uses the tower type identity once.
- The direct banner-data block contains 58 normal records, including one record
  explicitly named as the old Thor's Wrath definition. Excluding that obsolete
  record leaves 57 active normal banners.
- The active normal set resolves to 48 tower-specific and 9 unique banners.
- The current build contains 37 fusion records and 3 generalist records. These
  live results supersede the historical 36-fusion-title baseline; no count was
  forced to match the baseline.
- The resulting reviewed inventory contains 97 active banners. Direct
  `TowerTypes` facts provide tower relationships for tower-specific, unique,
  and fusion records. The runtime `RogueCardsManager` record supplies the
  category and progression context under which those records are selected.

## Normalization decisions

- Stable tower identity is based on the numeric `TowerType`, not on a scene
  instance or localized display name.
- Stable banner source identity combines the script type, localization key,
  normalized category, and declared tower-type relationship. This distinguishes
  the tower-specific and fusion variants that intentionally share a title.
- A true `IsAlwaysUnique` value maps to `unique`; other non-fusion banner records
  with one tower type map to `tower-specific`; `IsFusion` maps to `fusion`; and
  `IsGeneralistBanner` maps to `generalist`.
- The record explicitly named `Thors Wrath - Old` is obsolete. Its current
  counterpart remains active.
- Mock-up and scene-display objects with empty relationship data are not content
  definitions and are excluded from the stable inventory.
- Generalist records apply to every active tower in the manager's generalist
  selection context. All other relationships are taken exactly from the active
  record's `TowerTypes` values.

## Publication boundary

No raw dump, absolute installation path, game binary, copied localization
description, or game artwork is approved for commit or publication. The next
stage produces only stable identifiers, concise independently worded English and
German summaries, relationship facts, provenance, and original or otherwise
authorized visual metadata.
