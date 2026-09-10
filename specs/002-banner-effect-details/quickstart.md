# Banner Effect Details Validation

## Prerequisites

- Node.js 24 and the locked npm dependencies already installed under `webapp/`
- A local Nordhold Steam installation at the standard Windows path, build `23261523`
- The previously approved disposable extraction environment documented by the game-data skill

Do not place the raw extractor output inside the repository.

## Regenerate source facts

1. Run `.agents/skills/nordhold-game-data/scripts/extract_game_data.py` with an absolute game root and a unique JSON output path under the user temporary directory.
2. From `webapp/`, run `npm.cmd run content:generate -- --raw <absolute-temporary-json-path> --output src/content`.
3. Confirm the report identifies 97 banners, zero unresolved descriptions, and no missing rarity values.

## Validate

From `webapp/`, run:

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run content:contracts
npm.cmd run content:validate
npm.cmd test
$env:NORDHOLD_BUILD_DATE = "2026-09-08"
$env:NORDHOLD_COMMIT_SHA = (git rev-parse HEAD)
npm.cmd run build
npm.cmd run build:deterministic
npm.cmd run bundle:validate
```

Expected results:

- The content schema and active feature contract are synchronized.
- All 97 banners have sanitized English and German descriptions.
- Every tower-specific effect record has common, rare, and legendary values.
- Every generalist, unique, and fusion effect record has exactly one fixed value, and generation rejects differing source slots.
- Representative signed, percentage, duration, multiplier, integer, fixed, equal, and multi-value effects format correctly.
- The visible rarity key and sequence accessibility labels exist in both locales.
- The sequence CSS is non-breaking and does not create page-level overflow at 320 CSS pixels.
- Visible and generated release information reports `1.0.0`.
- The production bundle contains no raw dump, game binary, or unsupported localization language.

## Manual source sample

Compare at least one tower-specific, unique, fusion, and generalist banner against the temporary raw dump's active path ID and `I2Languages` English/German terms. Verify that markup is absent from the page while visible wording and punctuation are preserved.
