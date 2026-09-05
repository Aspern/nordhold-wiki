# Validation: Initial Wiki Platform

- **Validation date**: 2026-09-05
- **Application version**: 0.1.0
- **Local release build input**: `2026-09-05`, base commit
  `21b1276c03e5091f1d71c789d24c88f855c3ed83`
- **Source implementation outcome**: Technically validated and accepted by the
  human interface and visual review
- **AWS/DNS outcome**: Not executed; the separately approved lifecycle gate has
  not started

## Approval and Scope Evidence

- The human maintainer explicitly approved the dependency matrix, including
  access to the public npm registry and Terraform/provider distribution
  endpoints.
- The human maintainer explicitly authorized extraction and publication of the
  nine exact tower sprites from the local game installation for this wiki.
- Banner images are original deterministic CSS compositions. No banner media was
  copied from the game.
- No AWS account values, credentials, Terraform state, saved plans, raw game
  dumps, or extracted game binaries were added to the repository or production
  bundle.
- No AWS or one.com resource was read, created, modified, or destroyed during
  this validation.

## Content and Provenance

The approved read-only extraction workflow inspected Steam build `23261523` and
produced 1,164 candidate records with zero parser errors. Two irrelevant records
were excluded during normalization. The reviewed static content contains:

- 9 towers;
- 97 active banners;
- 158 tower-to-banner eligibility relationships;
- English and German names, independently written summaries, and fallback-safe
  alternatives;
- stable identifiers, source identity, provenance references, and deterministic
  ordering;
- nine authorized, fingerprinted tower PNGs and distinct original CSS banner
  definitions.

The content generator was run twice with identical checked-in JSON output.
Schema synchronization and content validation passed without unresolved
references, duplicate identities, missing localizations, or unreviewed visuals.

## Application Validation

The final attributable local validation used:

```powershell
$env:NORDHOLD_BUILD_DATE = '2026-09-05'
$env:NORDHOLD_COMMIT_SHA = '21b1276c03e5091f1d71c789d24c88f855c3ed83'
npm.cmd run validate:all
```

Result: passed. The command completed TypeScript checks, ESLint reporting,
Prettier verification, schema-contract synchronization, content validation,
functional unit tests, npm audit reporting, workflow inspection, two production
builds, deterministic-output comparison, and bundle-policy validation.

- 14 unit-test files passed.
- 39 functional unit tests passed.
- Coverage was 88.94% statements, 82.75% branches, 90.56% functions, and 89.30%
  lines.
- npm audit reported zero informational, low, moderate, high, or critical
  vulnerabilities.
- Two production builds were byte-identical: 15 output files and 879,922 bytes.
- The deployable bundle policy accepted 14 manifest files and 877,742 bytes for
  release 0.1.0.
- The manifest, release record, content hash, known route, local media allowlist,
  secret scan, source-map exclusion, and remote-script/font exclusions passed.

The local Vite server returned the catalogue, a known direct tower route, an
unknown direct route, release metadata, and static content successfully. A
headless browser rendered nine tower cards on `/` and exactly 18 eligible banner
cards for `/towers/arc-tower`; the tower-specific, generalist, unique, and fusion
group headings were all present. After the first human review iteration, a
second render confirmed larger divider-to-card spacing, classification-colored
count badges, category disclosure controls, a left-pointing catalogue-return
arrow, and two eligibility-derived tower sprites on each displayed fusion
banner. The rendered DOM contained four initially expanded native disclosure
groups, four count badges, and 16 tower symbols for Arc Tower's eight fusion
banners. The next review iteration changed the group presentation order to
tower-specific, fusion, unique, and generalist; the functional unit contract and
rendered German headings confirmed that sequence. Search, exact eligibility
grouping, stable route resolution, localization selection/fallback, and release
metadata are covered by the functional unit suite. This render check is
validation evidence, not an added browser E2E suite.

The local build used the current repository `HEAD` value while the implementation
was still an uncommitted working tree. Production provenance must therefore be
generated again from the reviewed committed revision by CI; this local release
record is not a production artifact.

## Infrastructure and Workflow Validation

Terraform 1.16.1 and the lock-file-pinned HashiCorp AWS provider 6.63.0 were used.
The provider was initialized only with `-backend=false`, so validation did not
access remote state or AWS.

- `terraform fmt -check -recursive` passed.
- Bootstrap initialization with the read-only lock file passed.
- Bootstrap `terraform validate -json` returned valid with zero errors and zero
  warnings.
- Production initialization with the read-only lock file passed.
- Production `terraform validate -json` returned valid with zero errors and zero
  warnings.
- Both provider lock files exist and are not ignored.
- State, backup state, backend configuration, variable values, saved plans,
  application build output, and reports are ignored as required.
- Static workflow inspection passed for the six exact jobs `infra:validate`,
  `app:validate`, `app:build`, `infra:plan`, `app:deploy`, and `infra:verify`.
- The workflow uses immutable action revisions, saved plan and bundle artifacts,
  artifact/manifest/hash checks, GitHub OIDC, a protected production environment,
  and the required validate-to-build-to-deploy-to-verify dependency gates.
- The command-level bootstrap, certificate/DNS, state migration/recovery, cache,
  cost, deployment, invalidation, and minimal source-revert rollback procedures
  were reviewed for presence and consistency with the accepted plan.

## Human Validation

The project owner accepted the complete manual interface and visual review on
2026-09-05 after two refinement iterations. The first iteration increased
category spacing, promoted counts to badges, added independently collapsible
groups, displayed eligibility-derived fusion tower combinations, and added the
left-pointing catalogue-return arrow. The second iteration changed the visible
group order to tower-specific, fusion, unique, and generalist. The accepted
checklist covers semantic structure, keyboard flow, visible focus, catalogue and
search behavior, direct routes, eligible-banner presentation, language
switching, release header consistency, responsive widths, text alternatives,
visual direction/mapping, and interactive-state contrast.

Routine component, browser E2E, visual-regression, accessibility, performance,
broad UX, Terraform mock, and live-AWS test suites were intentionally not added,
matching the accepted test scope.

## Deferred Operational Validation

Tasks T090-T093 remain deferred by the lifecycle gate. No bootstrap plan/apply,
state migration, ACM validation, one.com DNS edit, protected-environment setup,
production infrastructure apply, application publication, CloudFront
invalidation, or deployed smoke test has run. Those tasks require completed
convergence, human review of the draft pull request and exact plans, fresh
explicit approval for AWS/DNS mutation, human integration to `main`, and the
protected production approval described by the accepted artifacts.
