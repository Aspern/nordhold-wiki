# Nordhold Wiki Web Application

This module is the static Vue and Vuetify Nordhold wiki. It renders the complete
tower catalogue and each tower's eligible banner groups from checked-in JSON. It
has no backend, database, runtime CMS, authentication, analytics, or tracking.

## Prerequisites and Setup

- Node.js 24
- npm 11.6.2, as recorded by `packageManager`
- the dependency set and public npm access approved in the feature dependency
  review

Install the exact lockfile without changing it:

```powershell
cd .\webapp
npm.cmd ci
npm.cmd run dev
```

The development server exposes the catalogue at `http://localhost:5173/`.
Tower routes use stable language-independent paths such as
`/towers/arc-tower`. The first supported ordered browser language is selected;
German and English are supported and English is the fallback.

Banner classifications are expanded by default and can be collapsed
independently. Each classification badge reports the currently visible banner
count. Fusion banner cards derive and display their tower-icon combination from
the same validated eligibility relationships used to select the banner; the
pair is never maintained as separate presentation data.

## Content and Provenance

`src/content/wiki-content.json` is the browser data source.
`provenance.json`, `id-map.json`, and `normalization-report.json` make the
extraction and identity decisions reviewable. Draft 2020-12 schemas live in
`src/content/schemas/` and must stay byte-identical to the accepted feature
contracts.

The initial data was generated read-only from Nordhold Steam build `23261523`
with the repository `nordhold-game-data` skill. Raw extraction output belongs
only in a verified temporary directory and must never be committed. All effect
summaries are independently worded in English and German. The only game media
authorized for this application are the nine exact tower PNGs recorded in
`src/assets/entities/towers/extraction-manifest.json`; banner artwork is not
copied and is produced by the original deterministic CSS visual system.

For a future game update, follow the accepted refresh contract and content
inventory. Never replace stable IDs from translated names, silently accept parse
errors, copy bulk source text, or add media without explicit publication
authorization.

## Quality Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run content:contracts
npm.cmd run content:validate
npm.cmd run test
npm.cmd run validate
npm.cmd run validate:all
```

Vitest runs functional unit tests in Node for content interpretation, stable
identity, eligibility, search, localization, and release metadata. The suite
intentionally has no browser E2E, visual-regression, accessibility, performance,
or live-AWS integration tests. Interface and visual acceptance is recorded by a
human in the feature manual-review artifact.

## Production Build

One build date and full commit SHA identify the artifact independently of the
visitor's clock:

```powershell
$env:NORDHOLD_BUILD_DATE = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$env:NORDHOLD_COMMIT_SHA = (git rev-parse HEAD).Trim()
npm.cmd run build
npm.cmd run bundle:validate
npm.cmd run build:deterministic
Remove-Item Env:NORDHOLD_BUILD_DATE
Remove-Item Env:NORDHOLD_COMMIT_SHA
```

`dist/` contains the application, fingerprinted tower assets, an emitted content
JSON, `release.json`, and `bundle-manifest.json` with SHA-256 checksums and a
known-valid tower route. Bundle validation rejects source maps, raw dumps,
unapproved media, secrets, local paths, remote scripts/fonts, state/plans, and
metadata drift.

## Theme Rules

All shared colors, typography, spacing, radii, elevation, focus, motion,
breakpoints, and visual sizing are semantic custom properties in
`src/theme/tokens.css` with Vuetify mappings in `src/theme/index.ts`. Components
must use those tokens rather than introducing local color or style-guide
literals. Tower sprites remain exact; surrounding cards and all banner visuals
are original, modern presentation code.
