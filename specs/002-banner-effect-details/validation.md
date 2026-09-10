# Banner Effect Details Validation Record

## Source Extraction

- Steam app ID: `3028310`
- Steam build ID: `23261523`
- Unity version: `2023.1.22f1`
- Source assets: `NordHold_Data/resources.assets` and `NordHold_Data/level2`
- Extractor: `.agents/skills/nordhold-game-data/scripts/extract_game_data.py`
- Extractor version: `1.0.0`
- Python version: `3.13.5`
- UnityPy version: `1.25.3`
- TypeTreeGeneratorAPI version: `0.0.10`
- Raw record count: 1,164
- Parse error count: 0
- Excluded record count: 2
- Extracted languages: English and German only

The raw dump was written to a unique user temporary directory outside the
repository. It is not part of the working tree or intended build output.

## Generated Content

- Active banners: 97
- Structured tower-specific rarity effect records: 66
- Structured generalist, unique, and fusion fixed effect records: 60
- Total structured effect records: 126
- Eligibility relationships: 158
- Unresolved source tags or placeholders: 0

Representative records were traced from the reviewed inventory to the raw
asset records and generated output:

| Banner | Classification | Source path ID | Effect records |
| --- | --- | ---: | ---: |
| Barrier Shatter | tower-specific | 13340 | 2 |
| Chaos Storm | unique | 13344 | 1 |
| Charged Arrows | fusion | 13403 | 2 |
| Dispersion | generalist | 13435 | 2 |

## Verification

The following command completed successfully on 2026-09-10 with release inputs
`NORDHOLD_BUILD_DATE=2026-09-08` and the current branch HEAD as
`NORDHOLD_COMMIT_SHA`:

```powershell
npm.cmd run validate:all
```

Observed results:

- Type checking, ESLint, Prettier, contract synchronization, content
  validation, dependency audit, and workflow policy validation passed.
- All 15 test files and 53 tests passed with 89.22% statement coverage.
- Contract and regression tests confirmed that all 66 tower-specific effects
  retain rarity triplets, while all 60 generalist, unique, and fusion effects
  expose exactly one fixed value. Generation rejects divergent source slots for
  any non-tower-specific banner.
- The common, rare, and legendary text colors have contrast ratios of 12.36:1,
  8.99:1, and 9.20:1 respectively against the banner-card background; automated
  tests enforce the 4.5:1 minimum.
- Two production builds were byte-identical: 15 files and 982,027 bytes.
- Bundle policy validation passed for 14 files and 979,847 bytes at release
  version `1.0.0`.
- The build emitted the existing non-blocking warning for a JavaScript chunk
  larger than 500 kB.
