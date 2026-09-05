# Phase 0 Research: Initial Wiki Platform

## Research Method and Boundary

Research was completed on 2026-09-05 from official project, vendor, and platform
documentation. The local Nordhold installation was inspected read-only through
the `nordhold-game-data` skill. Its required files are present and the Steam
manifest reports build `23261523`, but the optional Python parsing dependencies
are not installed. The human-approval request to install them timed out, so no
packages were installed and no live extraction was attempted. The recorded
build baseline is useful for sizing only; implementation must produce and review
a fresh extraction before first-release JSON is accepted.

## Application Platform

### Decision: Vue 3.5, Composition API, strict TypeScript 6.0, Vite 8, Node 24 LTS

Use Vue single-file components with `<script setup lang="ts">`, strict compiler
settings, and type-aware lint rules. Build with Vite on Node 24 LTS. TypeScript
6.0 is selected instead of TypeScript 7.0 because 7.0 initially ships without
the compiler API used by ecosystem tools such as typescript-eslint. Exact
compatible versions must be pinned in `package-lock.json` when the dependency
set is approved.

Rationale:

- Vue documents Composition API and TypeScript support as the scalable Vue 3
  path ([Vue TypeScript guide](https://vuejs.org/guide/typescript/composition-api),
  [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq)).
- Vue 3.5 is the current stable Vue series while 3.6 remains prerelease
  ([Vue releases](https://github.com/vuejs/core/releases)).
- Vite 8 supports the static Vue build and requires a supported modern Node
  release ([Vite 8 announcement](https://vite.dev/blog/announcing-vite8),
  [Vite guide](https://vite.dev/guide/)).
- Node recommends LTS releases for production applications; Node 24 is an LTS
  line ([Node release schedule](https://nodejs.org/en/about/previous-releases)).
- TypeScript 6.0 retains the JavaScript compiler API and strict tool support,
  while the TypeScript 7.0 announcement documents its initial API limitation
  ([TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/),
  [TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)).

Alternatives considered:

- TypeScript 7.0 was rejected for the initial toolchain because its missing
  compiler API would force a split compiler/linter arrangement.
- Server-side rendering was rejected because it adds a runtime service with no
  accepted requirement and conflicts with the deliberately static architecture.

### Decision: Vuetify 4 for the Material component layer

Vuetify 4 satisfies the specification's clarified requirement for a
Vue-compatible Material Design framework and supports current Vue. The package
named `vue-material` was rejected because its latest npm release remains a beta
whose examples use the Vue 2 plugin API. Use only required Vuetify components,
local fonts/assets, and centralized theme configuration.

Sources: [Vuetify installation](https://vuetifyjs.com/getting-started/installation/),
[Vuetify releases](https://github.com/vuetifyjs/vuetify/releases), and
[vue-material package history](https://www.npmjs.com/package/vue-material?activeTab=versions).

Alternatives considered:

- The package literally named `vue-material` was rejected as stale and
  incompatible with the selected modern Vue architecture.
- Hand-building a Material component system was rejected because it duplicates
  accessible interaction behavior and would increase delivery risk.

### Decision: Vue Router history mode with CloudFront path rewriting

Use `/` for the tower catalogue and `/towers/:towerId` for stable tower detail
links. CloudFront rewrites extensionless application paths to `/index.html`, and
Vue Router displays a localized not-found view for unknown identifiers. Static
asset and JSON paths are not rewritten.

Rationale: Vue Router recommends HTML5 history mode for natural URLs but requires
server fallback configuration, and it explicitly recommends an application
catch-all route for invalid paths
([history mode](https://router.vuejs.org/guide/essentials/history-mode),
[RouterOptions](https://router.vuejs.org/api/interfaces/routeroptions)).

Hash routes were rejected because they weaken the stable, human-readable direct
URL requirement.

### Decision: Vue I18n with browser negotiation and English fallback

Keep UI messages in separate `en.json` and `de.json` catalogues. Determine the
first supported locale from `navigator.languages`, normalize regional variants
such as `de-DE` to `de`, and otherwise select English. All entity names, effect
summaries, alternative text, empty states, errors, and labels use the same
locale. Configure English as the explicit fallback locale
([Vue I18n fallback](https://vue-i18n.intlify.dev/guide/essentials/fallback)).

A hand-written translation registry was rejected because fallback, interpolation,
and missing-key behavior are established i18n concerns already covered by Vue
I18n.

## Content and Data Integrity

### Decision: JSON Schema Draft 2020-12 plus custom semantic validation

Use Ajv 8's Draft 2020-12 entry point for the three checked-in contracts. JSON
Schema validates structure, enums, patterns, required translations, and closed
objects. A TypeScript validator additionally enforces global stable-ID
uniqueness, eligibility cross-references, one visual per entity, matching
provenance records, deterministic sort order, and absence of production
placeholder assets.

Sources: [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) and
[Ajv JSON Schema support](https://ajv.js.org/json-schema.html).

Pure TypeScript interfaces were rejected as the only contract because they do
not validate checked-in JSON at runtime or in CI. JSON Schema alone was rejected
because relational constraints across arrays are clearer and more maintainable
as tested application logic.

### Decision: normalize extracted facts and preserve editorial presentation

The raw extractor output is an uncommitted, temporary interchange file. The
normalizer maps source-internal keys to reviewed stable IDs, records provenance,
derives banner eligibility from runtime banner-manager references, and writes
canonical JSON with stable ordering. Localized concise effect summaries and
original/authorized visual metadata are editorial fields preserved by stable ID
across refreshes. A refresh fails until all new or changed entities have required
English content, English and German effect summaries, and a compliant distinct
visual. It reports every other unavailable German field that will use the
specified English fallback.

This split avoids publishing raw game dumps or copied strings while keeping game
facts traceable. Source object path IDs are stored as decimal strings because
Unity 64-bit IDs are unsafe as JavaScript numbers.

### Decision: classification and eligibility are explicit normalized facts

Every banner has exactly one classification: `tower-specific`, `generalist`,
`unique`, or `fusion`. Every eligibility row references one tower and one banner.
The detail page shows the union of its tower-specific rows plus all applicable
generalist, unique, and fusion rows; it never assumes eligibility merely because
a banner asset exists.

The skill baseline for build `23261523` reports 9 towers, 57 normal banner
titles, 36 fusion banner titles, 3 generalist titles, and one obsolete record.
Those figures are not accepted content. The implementation refresh must resolve
runtime references, duplicates, obsolete data, and unique classification before
committing the first dataset.

### Decision: original or authorized visuals with reviewable metadata

Entity media lives in `webapp/src/assets/entities/` and is referenced by an
asset ID, local path, dimensions, SHA-256 digest, authorship statement, and
license/reference note. Game extraction never exports images. Production
validation rejects missing, duplicated, generic-placeholder, remote, or
unreviewed visual records.

Automatic copying of game icons was rejected because the repository rules do
not authorize publication of copyrighted game assets. A single generic fallback
was rejected by the accepted specification.

## Testing and Quality Tooling

### Decision: Vitest unit tests for functional domain requirements only

Use Vitest in its Node environment for unit tests of content interpretation,
normalization, search, eligibility, locale selection and fallback, route-state
resolution, and release metadata. Schema/content validators, TypeScript, lint,
format, build, Terraform validation, and the required deployed-site smoke check
remain separate quality or operational checks. Component, DOM, browser E2E,
live-AWS integration, visual-regression, performance, accessibility, and broad
UI/UX automated test suites are intentionally excluded. Keyboard, responsive,
accessibility-baseline, and visual-direction acceptance is documented through a
human review after implementation.

Source: [Vitest guide](https://vitest.dev/guide/index.html).

### Decision: ESLint flat config and separate Prettier checking

Use ESLint's flat configuration with `@eslint/js`, type-aware
`typescript-eslint`, and `eslint-plugin-vue` recommended rules. Prettier runs as
a separate `--check` command with `eslint-config-prettier` disabling conflicting
format rules; do not run Prettier as an ESLint plugin. Pin local exact versions.

Sources: [eslint-plugin-vue user guide](https://eslint.vuejs.org/user-guide/),
[typescript-eslint setup](https://typescript-eslint.io/getting-started/), and
[Prettier's linter integration guidance](https://prettier.io/docs/next/integrating-with-linters.html).

### Decision: npm audit reports all findings and gates high severity

Run `npm audit --json --audit-level=high` from the committed lockfile, retain the
machine-readable report, and fail the job for high or critical findings. Lower
severity findings remain visible for triage. Do not use `--force` or mutate the
lockfile in CI ([npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/)).

### Decision: narrowly explicit dependency-registry access in CI

Routine CI may contact the public npm registry for the committed-lockfile
`npm ci` and `npm audit` operations. Terraform initialization and planning may
contact the public Terraform Registry and the locked provider's public
distribution endpoints. A registry outage fails the affected job; CI does not
fall back to an unverified package or provider source. Functional unit tests and
repository validators use committed fixtures and do not require external network
access. No Steam or extraction dependency is introduced into routine CI.

## Theme and Accessibility

### Decision: a two-layer centralized theme

Define semantic color, spacing, typography, radius, elevation, motion, and
breakpoint tokens in one theme module and token stylesheet. Map Vuetify theme
roles to those tokens. Components may reference only semantic theme values, not
literal visual constants in local CSS. Entity artwork is content and therefore
does not define application theme values.

The first release implements the accepted practical accessibility baseline:
semantic headings and landmarks, keyboard-operable search and cards, visible
focus, programmatic labels, text alternatives, readable contrast, responsive
reflow, and a non-color-only representation of banner classes. Full audit or
certification remains outside scope.

## AWS and Terraform

### Decision: private S3 origin, CloudFront OAC, ACM in `us-east-1`

Provision a versioned, encrypted, public-blocked S3 application bucket. CloudFront
uses Origin Access Control with always-signed requests and a bucket policy scoped
to the distribution ARN. Redirect HTTP to HTTPS and attach an ACM certificate
requested in `us-east-1`, which CloudFront requires for viewer certificates.
Use `eu-central-1` for the S3 application and state buckets because Frankfurt is
the operationally closest AWS region for this Germany-hosted project; CloudFront
remains global. Terraform uses a deliberate `us-east-1` provider alias only for
the certificate.

Sources: [CloudFront OAC for S3](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
and [CloudFront certificate requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html).

An S3 website endpoint was rejected because it cannot use OAC and would expose a
public origin. Route 53 was rejected because the parent domain remains hosted at
one.com and only one subdomain is needed.

### Decision: manual one.com DNS validation and alias bootstrap

Terraform requests the certificate and outputs its DNS validation CNAME. A human
adds that record in one.com, waits for issuance, and authorizes the next apply.
After CloudFront exists, the human adds `nordhold` as a CNAME to the distribution
domain. This avoids storing one.com credentials or using an additional provider
([one.com CNAME instructions](https://help.one.com/hc/en-us/articles/360000803517-How-do-I-create-a-CNAME-record)).

### Decision: separate bootstrap and production Terraform roots

`infra/bootstrap/` creates the encrypted/versioned Terraform state bucket,
least-privilege GitHub OIDC roles, and the ACM certificate request in
`us-east-1`. Its initially local state is migrated to the new remote backend
during the approved, human-assisted bootstrap. Keeping the certificate request
here lets Terraform output its DNS validation record before a distribution is
planned; the record remains in one.com so ACM can renew the certificate.
Production uses an S3 backend with native lockfiles; DynamoDB locking is not
introduced because HashiCorp marks it deprecated. Backend account-specific
values and the issued certificate ARN are passed through protected partial
configuration, never committed.

The bootstrap resolves the account's existing GitHub Actions OIDC provider by
the canonical `https://token.actions.githubusercontent.com` URL. The provider is
created once and managed outside Nordhold; this root owns only Nordhold's
repository-scoped plan/apply roles and policies. A bootstrap plan must stop if
the provider is absent or incompatible and must never propose another provider
with the same URL.

The existing GitHub organization OIDC subject template augments repository
names with the stable numeric owner and repository IDs. Bootstrap therefore
accepts those reviewed non-secret IDs separately and builds the exact customized
pull-request, `main`, and `production` environment subjects. This preserves the
account's established anti-renaming control without broadening either role to an
organization-wide wildcard.

Source: [AWS CreateOpenIDConnectProvider API](https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateOpenIDConnectProvider.html),
which defines the provider URL as unique within an AWS account.

The state bucket uses S3-managed encryption, public-access blocking, versioning,
TLS-only access, and separate `bootstrap/terraform.tfstate` and
`production/terraform.tfstate` keys with native `.tflock` objects. State recovery
uses reviewed S3 object versions; routine operators do not hand-edit state.

`infra/production/` owns the application bucket, OAC, distribution, rewrite
function, headers, policies, and outputs, and accepts only the issued bootstrap
certificate ARN for the exact domain. Terraform 1.16.1 is pinned and the AWS
provider is locked to the approved exact version. Formatting and
`terraform validate` check configuration without AWS credentials or resource
creation; the generated plan and its policy changes are reviewed before an
approved apply.

Sources: [S3 backend and lockfiles](https://developer.hashicorp.com/terraform/language/backend/s3)
and [Terraform validate](https://developer.hashicorp.com/terraform/cli/commands/validate).

### Decision: explicit caching, security headers, and rollback

Use long-lived immutable caching for fingerprinted assets and short/no-cache
behavior for `index.html`, content JSON, and `release.json`. A viewer-request
CloudFront Function rewrites only application routes. A response headers policy
sets HSTS, nosniff, frame denial, a strict referrer policy, and a tested CSP that
allows only local assets plus the minimal inline-style behavior required by
Vuetify. No external fonts or scripts are loaded. Deployment invalidates only
mutable shell and JSON paths.

Enable application-bucket versioning. The constitution-required minimal rollback
procedure reverts to a previously successful source revision and runs the full
validated release workflow with a fresh plan; operators do not hand-edit S3
objects or Terraform state. No recovery-time target, retained-artifact window,
or custom backup regime is introduced by this feature. CloudFront access
logging, WAF, Route 53, and custom monitoring are deferred because the initial
public static site does not justify their cost, privacy surface, or complexity.
CloudFront default metrics and the required release smoke check provide the
initial operational signal.

Source: [CloudFront response headers policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/creating-response-headers-policies.html).

### Decision: cost-bounded initial delivery

Use CloudFront `PriceClass_100` for the initial Germany-focused audience and make
the selection explicit in Terraform. The solution has no continuously running
compute, database, NAT gateway, Route 53 hosted zone, WAF, or custom logging
pipeline. Primary cost drivers are stored bytes and versions, CloudFront requests
and transfer, invalidations beyond any included allowance, and CI usage. Review
current AWS pricing before the first approved apply; do not encode a currency
estimate as a durable guarantee. Repository and platform defaults govern CI
artifact retention unless a later operational requirement changes them.
Expanding geographic edge coverage or adding logs/WAF requires an operational
review, not an application redesign. AWS documents that a
restricted price class bounds edge-location selection and may trade latency for
viewers outside it ([CloudFront distribution settings](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesGeneral.html)).

### Decision: consistent tagging

Use AWS provider `default_tags` for `Project=nordhold-wiki`, `Environment`,
`ManagedBy=terraform`, `Service=wiki-platform`, and a configurable cost-owner
tag. Add explicit tags where provider behavior requires them and document AWS
resources that do not support tags.

## CI/CD

### Decision: one GitHub Actions workflow with exact display job names

Use safe internal identifiers and the required display names:

1. `infra:validate`
2. `app:validate`
3. `app:build`
4. `infra:plan`
5. `app:deploy`
6. `infra:verify`

Dependencies form validate -> build/plan -> deploy -> verify. Application build
runs once and uploads a checksummed artifact containing static files and
`release.json`. Deployment downloads that exact artifact and the fresh saved
Terraform plan; it never rebuilds. Reports for lint, formatting, unit tests,
coverage, audit, build manifest, and Terraform validation/plan are retained as
workflow artifacts under repository defaults
([GitHub Actions artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)).

### Decision: one-time out-of-CI bootstrap, then approved main deployment

The first infrastructure pull request cannot use the production remote backend
or OIDC plan role before those prerequisites exist. After source-only validation,
convergence, and review of the exact bootstrap plans, a human may explicitly
approve a one-time bootstrap outside CI from that reviewed revision. It creates
remote state, OIDC roles, certificate validation, initial empty static-delivery
resources, and the required one.com DNS records, but publishes no wiki release.
The infrastructure pull-request jobs are then rerun with the established plan
role before merge.

Pull requests never assume the apply role or publish application assets. After
the accepted change is integrated into `main`, all relevant gates rerun on that
exact commit, a fresh plan is produced, and deployment uses a protected
`production` environment with a required reviewer and main-branch restriction.
Every recurring infrastructure change and application release then uses this
workflow. Repository support for environment reviewers must be confirmed during
bootstrap; deployment remains disabled until that control is available.
Concurrency permits only one production mutation at a time.

Sources: [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
and [deployment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).

### Decision: GitHub OIDC with separate planning and deployment roles

Use GitHub OIDC with an audience of `sts.amazonaws.com` and trust conditions
restricted to the repository and expected pull-request or production-environment
subjects. The non-resource-mutating plan role may read deployed-resource
metadata and use only the exact remote-state prefix. Its backend permissions are
limited to listing the state prefix, getting and putting the exact state object,
and getting, putting, and deleting only its `.tflock` object as required for
native S3 locking. It cannot apply managed-resource changes, publish application
assets, or invalidate CloudFront. The deployment role is available only through
the protected production environment and can apply the accepted Terraform scope,
publish to the named bucket, and invalidate the named distribution. Workflow
actions are pinned to reviewed immutable commit SHAs. No AWS access keys are
stored in GitHub or the repository.

The deploy stage separates mutation responsibilities: `infra:apply` verifies and
applies the retained plan only on `main`, while the dependent `app:deploy` job
reads the resulting Terraform outputs and publishes the retained application
bundle without calling `terraform apply`. Workflow-level concurrency serializes
the complete release chain rather than leaving a gap between job-level locks.

Source: [GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

### Decision: narrow post-deployment verification

After deployment, request the public HTTPS root, `release.json`, and one stable
tower route. Require trusted HTTPS, successful status, HTML/JSON content types,
and exact version plus commit SHA matching the promoted artifact. This is the
only routine live-environment test and is explicitly required by the accepted
specification.

## Build Metadata and Determinism

### Decision: generate release metadata once per promoted build

`package.json.version` is the sole wiki version. The build job receives one UTC
calendar date and the full source commit SHA, validates both, and writes:

```json
{
  "version": "<package version>",
  "buildDate": "YYYY-MM-DD",
  "commitSha": "<40 hexadecimal characters>"
}
```

The application imports the same generated record displayed by the header, and
the build copies it to `/release.json` for verification. Given the source tree,
lockfile, toolchain, and supplied metadata, normalization and build output are
repeatable. Deployment does not substitute dates or versions.

## Dependency Approval Gate

The repository currently has no application dependency manifest. Read-only
registry inspection on 2026-09-05 produced the exact candidate set below; no
package or provider was installed. Versions, licenses, compatibility, and impact
must be reviewed together before the human approval required by repository
policy.

| Scope                      | Exact candidate versions                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Security and license review                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Maintenance and compatibility                                                                                                                                             | Bundle or operational impact                                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime UI                 | `vue@3.5.42`, `vuetify@4.2.0`, `vue-router@4.6.4`, `vue-i18n@11.4.10`                                                                                                                                                                                                                                                                                                                                                                                                              | npm metadata reports MIT licenses; the approved lockfile must pass the high-severity audit gate. No runtime CDN is used.                                                                                                                                                                                                                                                                                                                                                                                                                                            | Current maintained majors; Router 4 is deliberately retained for the Vue 3 SPA design even though a newer router major exists. Peer ranges align with Vue 3.5.            | These are the only third-party browser-runtime packages. Vuetify components and locale features are imported selectively; the production build reports actual generated sizes after approval, without inventing an initial size KPI. |
| Build and type checking    | `vite@8.2.2`, `@vitejs/plugin-vue@6.0.8`, `vite-plugin-vuetify@2.1.3`, `typescript@6.0.3`, `vue-tsc@3.3.11`, `@types/node@24.13.3`                                                                                                                                                                                                                                                                                                                                                 | Registry metadata reports MIT except TypeScript, which reports Apache-2.0; all remain subject to the committed-lockfile audit.                                                                                                                                                                                                                                                                                                                                                                                                                                      | The selected Vite plugins declare compatibility with the selected Vite/Vue lines; `vue-tsc` supports the selected TypeScript line. Node 24 LTS is the execution baseline. | Development/build only; none is imported into browser application code. Vite/Vuetify integration controls tree-shaking and emits the size report.                                                                                    |
| Content validation         | `ajv@8.20.0`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | npm metadata reports MIT; audited through the lockfile. JSON inputs remain untrusted and are validated before build.                                                                                                                                                                                                                                                                                                                                                                                                                                                | Maintained Draft 2020-12 implementation matching the checked-in schemas.                                                                                                  | Build/validation only; it is not required by the deployed static runtime.                                                                                                                                                            |
| Functional unit tests      | `vitest@5.0.0`, `@vitest/coverage-v8@5.0.0`                                                                                                                                                                                                                                                                                                                                                                                                                                        | npm metadata reports MIT; exact matching versions reduce runner/coverage skew and are audited through the lockfile.                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Vitest 5 supports the selected Vite line and Node 24. No DOM, component, or E2E dependency is proposed.                                                                   | Development/CI only; zero browser-bundle impact. Coverage and JUnit reports add CI time and artifact storage only.                                                                                                                   |
| Lint and format            | `eslint@10.10.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.69.0`, `eslint-plugin-vue@10.10.0`, `prettier@3.9.6`, `eslint-config-prettier@10.1.8`                                                                                                                                                                                                                                                                                                                                  | npm metadata reports MIT; all packages are audited from the lockfile.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Declared peer ranges align on ESLint 10, TypeScript 6.0, and Vue 3.                                                                                                       | Development/CI only; zero browser-bundle impact. Type-aware linting increases validation time but replaces overlapping ad hoc checks.                                                                                                |
| Terraform CLI and provider | Terraform CLI `1.16.1`; `hashicorp/aws@6.63.0`                                                                                                                                                                                                                                                                                                                                                                                                                                     | Official HashiCorp distributions and checksums only; the dependency lock file records provider hashes. Provider source/license and security notices require human review before approval.                                                                                                                                                                                                                                                                                                                                                                           | Stable Terraform 1.16 patch and maintained AWS provider 6 line selected together; exact provider lock prevents an unreviewed upgrade.                                     | Tool/provider download and local cache only; no web bundle impact. Provider installation may contact the allowed Terraform registry/distribution endpoints.                                                                          |
| Workflow actions           | `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1), `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` (v7.0.0), `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (v7.0.1), `actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` (v8.0.1), `aws-actions/configure-aws-credentials@cbe3b392738ccf3f987d68400dafcf4b0624a56c` (v6.2.4), `hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e` (v4.0.1) | Immutable full commit SHAs limit tag movement; licenses, source ownership, permissions, and release notes require human review. Workflow permissions remain least privilege.                                                                                                                                                                                                                                                                                                                                                                                        | Current maintained action releases selected for Node 24 and the chosen Terraform/AWS OIDC workflow.                                                                       | CI-only downloads and execution; no browser-bundle impact. Artifact actions use repository-default retention.                                                                                                                        |
| Local extraction only      | `UnityPy==1.25.3`, `TypeTreeGeneratorAPI==0.0.10`                                                                                                                                                                                                                                                                                                                                                                                                                                  | Exact-version PyPI metadata for [UnityPy 1.25.3](https://pypi.org/project/UnityPy/1.25.3/) includes the full MIT license and its MIT classifier. [TypeTreeGeneratorAPI 0.0.10](https://pypi.org/project/TypeTreeGeneratorAPI/0.0.10/) reports MIT and trusted-publishing provenance to source commit `df79bd6a786d4ba52ed4a7b3d40047ecf578256b`; that exact commit contains the repository's [MIT license](https://github.com/UnityPy-Org/TypeTreeGeneratorAPI/blob/df79bd6a786d4ba52ed4a7b3d40047ecf578256b/LICENSE). The isolated environment is never committed. | Both support the Python 3.13 maintainer environment by their declared Python ranges; actual decoding remains validated against the recorded game build.                   | Maintainer-only temporary environment; absent from application CI/runtime and the public bundle. Raw output remains ignored and temporary.                                                                                           |

The approval decision must explicitly cover this exact matrix. The previously
unresolved extractor-license metadata has been verified from the exact package
records and release-linked source above; both candidates are MIT-licensed. After
approval, implementation pins the candidates in `package-lock.json` and
`.terraform.lock.hcl`, runs `npm audit`, and records measured production bundle
output. Any version change, incompatible peer result, material security finding,
license problem, or unexpected runtime bundle dependency pauses installation and
requires an updated review and renewed approval. No approval is implied by this
research artifact.

### Approval record

On 2026-09-05, the human owner explicitly approved the complete dependency
matrix above. The approval covers only the exact versions and immutable action
revisions recorded in this document. It authorizes adding and installing those
dependencies for implementation and validation; it does not authorize version
substitution or AWS resource mutation.
