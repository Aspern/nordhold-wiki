# Quickstart: Initial Wiki Platform

This document describes the expected developer and operator workflow after the
implementation tasks are complete. Commands that install dependencies or touch
AWS are deliberately separated from safe local validation.

## Prerequisites

- Node.js 24 LTS and its supported npm release
- Terraform 1.16.1
- Git
- Explicit human approval for the exact dependency impact matrix in
  `research.md` before the first `npm ci` or provider initialization
- For a content refresh only: an approved isolated Python environment, a local
  Nordhold Steam installation, and the prerequisites in
  `contracts/game-data-refresh.md`
- For bootstrap or deployment only: authorized AWS and one.com access plus
  explicit approval for the exact mutation

On Windows PowerShell, use `npm.cmd` if execution policy prevents the `npm.ps1`
shim from running.

## Safe Local Application Validation

After dependencies and the committed lockfile have been approved and created:

```powershell
Set-Location .\webapp
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run content:validate
npm.cmd test
```

`npm ci` and `npm audit` may contact the explicitly accepted public npm registry;
the remaining application checks use repository inputs.

Expected result: every command exits zero; content validation confirms schemas,
references, localization fallback, provenance, distinct visual assets, and
deterministic ordering. Functional unit tests use repository fixtures and do not
require AWS, Steam, a DOM, or a browser service.

To create a local production artifact, provide explicit reproducible release
inputs rather than reading a browser clock:

```powershell
$env:NORDHOLD_BUILD_DATE = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$env:NORDHOLD_COMMIT_SHA = (git rev-parse HEAD).Trim()
npm.cmd run build
```

Expected result: `dist/` contains the application, fingerprinted assets,
`release.json`, and a checksummed manifest. The header version matches
`package.json`; the displayed build date comes from the generated release record.
Unset task-specific environment variables after the check if desired.

## Safe Local Infrastructure Validation

These commands do not configure a remote backend or apply resources. First-time
initialization can download the pinned provider from the network.

```powershell
terraform fmt -check -recursive .\infra
terraform -chdir=.\infra\bootstrap init -backend=false
terraform -chdir=.\infra\bootstrap validate
terraform -chdir=.\infra\production init -backend=false
terraform -chdir=.\infra\production validate
```

Expected result: formatting and configuration validation pass without AWS
credentials and without reading or changing shared resources. First-time
initialization may access the explicitly allowed Terraform Registry and provider
distribution endpoints for the locked provider.

## Run the Application Locally

```powershell
Set-Location .\webapp
npm.cmd run dev
```

Verify manually:

1. `/` shows every fixture tower and filters localized tower names.
2. Selecting a tower creates `/towers/<stable-id>`.
3. Refreshing that direct path resolves the same tower in the development server.
4. Only eligible banners appear, in the four mutually exclusive groups.
5. Banner filtering never introduces an ineligible item.
6. German-first browser preferences select German; unsupported preferences use
   English; a missing German game value visibly falls back to English without a
   raw translation key.
7. Keyboard users can operate searches, tower selection, clearing, and return
   navigation with visible focus.
8. The header contains title, attribution, package version, and localized build
   date.
9. A human reviewer records that every tower and banner visual is distinct,
   correctly mapped, recognizable, original or authorized, and consistent with
   the intended modern visual direction; rejected visuals are revised and
   reviewed again.

This manual pass is supplementary and is not a routine CI E2E suite.

## On-Demand Game-Data Refresh

Do not run this section until the parser dependencies have explicit approval.
Follow the repository `nordhold-game-data` skill and
`contracts/game-data-refresh.md`; never substitute an ad hoc dump script.

The maintainer workflow is:

1. Create an isolated environment outside the game installation.
2. Install only the approved pinned parser dependencies.
3. Run the reusable extractor read-only against the recorded Steam build and
   direct its raw output to a verified ignored temporary directory.
4. Generate the entity completion checklist, with one review item per stable
   tower and banner identifier.
5. Complete and review each tower checklist item, including original English and
   German effect summaries, localized names, alternative text, visual mapping,
   authorship, and license/reference evidence.
6. Complete and review each banner checklist item using the same fields and
   verify its classification and eligibility evidence.
7. Run the TypeScript normalizer and content validation twice and confirm the
   second normalization creates no factual or ordering diff.
8. Review the build ID, engine version, runtime eligibility references, obsolete
   and duplicate exclusions, parse results, uncertainty, stable-ID changes,
   provenance, and visual authorization.
9. Stage only normalized JSON, provenance, justified ID-map edits, original or
   authorized assets, and review documentation. Confirm no raw dump, binary,
   copied game media, absolute local path, or bulk source text is staged.

If any parser error or uncertainty remains, keep the existing accepted dataset
and stop the refresh.

## Human-Assisted AWS and DNS Bootstrap

Bootstrap is an explicit one-time operator procedure outside CI, never part of
routine CI. It starts only after source implementation, Spec Kit convergence,
full local validation, and human review of the draft pull request and exact
bootstrap plans. Before each Terraform plan/apply or DNS edit, obtain explicit
human approval and review the exact target account, region, resources, and
resolved state location. Bootstrap must not upload or publish the wiki bundle.

The planned sequence is:

1. Apply `infra/bootstrap/` to create the encrypted, versioned remote-state
   bucket in `eu-central-1`, scoped GitHub OIDC roles, and ACM certificate request
   in `us-east-1`.
2. Migrate the bootstrap state into its reviewed remote key and verify locking,
   recovery, and access. Never commit state or backend account values.
3. Configure protected GitHub variables and the `production` environment,
   restricted to `main` with a required human reviewer.
4. Add the bootstrap output's ACM validation CNAME at one.com, keep it in place
   for renewal, and wait for the certificate to be issued.
5. Store the issued certificate ARN as a protected non-secret configuration
   value for production planning.
6. As the accepted one-time bootstrap exception, create and review a fresh
   production plan, then apply the private empty application bucket, OAC,
   CloudFront distribution, route rewrite, policies, and tags without uploading
   application assets.
7. Add the `nordhold` one.com CNAME pointing to the Terraform-output CloudFront
   domain.
8. Verify HTTPS configuration, origin privacy, cache policy, tags, state recovery,
   and rollback documentation. Record non-secret outputs in protected
   configuration; direct application routes remain a release-verification check.
9. Rerun the pull-request workflow and review the non-resource-mutating
   `infra:plan` against the bootstrapped remote state.
10. Enable the production workflow only after all bootstrap checks pass and a
    human integrates the accepted revision into `main`.

The implementation must expand `infra/README.md` into a command-level runbook
with backup/recovery and rollback checks before any shared apply is authorized.

## Release Verification

Do not enable the first production run until Spec Kit convergence and full local
validation are complete, a draft pull request has passed human review, and the
accepted revision has been integrated into `main` by a human. An approved
`main` release then runs the exact job names and dependencies described in
`contracts/ci-cd.md`. The deploy job promotes the existing bundle and saved plan;
it does not rebuild.

For an additional read-only operator check after `infra:verify`:

```powershell
$release = Invoke-RestMethod 'https://nordhold.asperntallow.de/release.json'
$release
Invoke-WebRequest 'https://nordhold.asperntallow.de/' -MaximumRedirection 0
```

The release version and commit must match the workflow's promoted manifest, TLS
must be trusted, and the production job must show its human approval. A failed
smoke test means the release is failed even if S3 publication completed.

## Rollback

Revert to a previously successful source revision, then run a fully validated
release with a fresh infrastructure plan and production approval. Do not
manually edit Terraform state or S3 objects. This feature defines no recovery-
time target, retained-artifact window, or custom backup regime. If rollback
validation is incomplete, leave the incident and release marked as failed and
escalate to an authorized operator.
