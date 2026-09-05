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
- Static workflow inspection passed for the seven exact jobs `infra:validate`,
  `app:validate`, `app:build`, `infra:plan`, `infra:apply`, `app:deploy`, and
  `infra:verify`.
- The workflow uses immutable action revisions, saved plan and bundle artifacts,
  artifact/manifest/hash checks, GitHub OIDC, a protected production environment,
  a main-only Terraform apply separated from application publication, and the
  required validate-to-build-to-deploy-to-verify dependency gates.
- The revised workflow policy validator, TypeScript check, ESLint, and Prettier
  checks passed after the apply/publication split.
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

## Operational Bootstrap and Pull-Request Plan Validation

### Shared bootstrap evidence

On 2026-09-05, the target account was inspected with the approved short-lived
operator session. Exactly one GitHub Actions OIDC provider was found for
`token.actions.githubusercontent.com`, and its client ID list includes
`sts.amazonaws.com`. The approved bootstrap plan was generated with Terraform
1.16.1 and the locked HashiCorp AWS provider 6.63.0 from an ignored backend-free
working copy. It contained 12 creates, 0 updates, 0 destroys, one read of the
existing provider, and no managed OIDC-provider action.

After explicit approval, the exact bootstrap plan created the Nordhold state
bucket, repository-scoped plan/apply roles and policies, and ACM certificate
request. The state was migrated to its reviewed S3 key. Remote state reads from
the working copy and repository root had matching lineage and serial; S3
versioning, AES-256 encryption, and all four public-access-block controls were
verified. Every post-migration bootstrap plan reported no changes.

The project owner added the ACM CNAME at one.com. Both authoritative one.com
name servers and two independent public resolvers returned the exact target,
and ACM subsequently reported `ISSUED`. All nine required non-secret GitHub
repository variables were configured and compared with the current Terraform
outputs and reviewed local inputs, including `BOOTSTRAP_COMPLETE=true`. Their
account-specific values are not recorded in the repository.

### Pull-request plan evidence

The first enabled PR plan exposed the organization's customized OIDC subject,
which binds repository names to immutable numeric owner/repository IDs. The
bootstrap source and both Nordhold role trust policies were updated in-place
after explicit approval without changing permissions or managing the shared
provider. Two later PR attempts identified the exact `acm:ListCertificates` and
`acm:GetCertificate` calls required by the Terraform certificate data source;
each read-only permission was added through a separately reviewed and approved
one-policy Terraform plan. Every resulting bootstrap follow-up plan was empty.

GitHub Actions run `33985949525` then completed successfully for the current PR
revision. `infra:validate`, `app:validate`, `app:build`, and `infra:plan` passed;
`infra:apply`, `app:deploy`, and `infra:verify` were skipped as required for a
pull request. The downloaded production-plan artifact matched its workflow
merge SHA and workspace metadata, and its binary SHA-256 matched the retained
checksum. The reviewed plan contains 11 creates, 0 updates, and 0 destroys: the
private application bucket and controls plus the CloudFront OAC, function,
policies, and distribution.

### Initial production infrastructure evidence

The project owner explicitly approved the retained 11-create, zero-update,
zero-destroy production plan. On 2026-09-05, that exact checksummed CI plan was
applied locally with Terraform 1.16.1 and the approved short-lived operator
session. The apply created 11 resources, changed none, and destroyed none. A
fresh post-apply plan reported no changes.

The empty application origin was verified to contain zero objects, deny direct
public access, enable versioning and AES-256 encryption, retain all four public
access blocks, use a non-public bucket policy, and include every required tag.
The production remote-state object exists at the reviewed key with versioning
and AES-256 encryption. The CloudFront distribution reached `Deployed`, uses
the issued bootstrap certificate and `nordhold.asperntallow.de` alias, redirects
HTTP to HTTPS, uses Price Class 100, attaches an always-signing SigV4 S3 OAC,
contains the three reviewed cache behaviors, and includes every required tag.
Direct requests to the private S3 origin and the intentionally empty CloudFront
distribution both returned HTTP 403 as expected before application publication.

The GitHub `production` environment was created with `Aspern` as its required
human reviewer, custom deployment-branch policies enabled, and exactly one
deployment rule for `main`. The environment configuration was read back through
the GitHub API and matched those controls.

The project owner added the separate one.com application CNAME for
`nordhold.asperntallow.de`. Both authoritative one.com name servers and the
public resolver subsequently returned `d195tdpz6cudel.cloudfront.net`. An HTTPS
request through the public hostname completed TLS negotiation and returned the
expected HTTP 403 from the intentionally empty distribution. This completed the
approved no-publication bootstrap boundary in T090.

No application bundle has been published, and no CloudFront invalidation or
deployed smoke check has run. A fresh post-bootstrap pull-request plan, human PR
integration, and the verified `main` release required by T091-T093 remain
outstanding.
