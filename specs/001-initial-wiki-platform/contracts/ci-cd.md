# CI/CD Contract

## Workflow Boundary

Use one GitHub Actions workflow with conceptual stages implemented through
explicit `needs` dependencies. Job keys may be identifier-safe, but each job's
display `name` must exactly match the required value below. All reusable actions
are pinned to reviewed immutable commit SHAs.

```text
validate                      build                     deploy                         verify
infra:validate ----+--------> app:build ----+---------> infra:apply ---> app:deploy ---> infra:verify
app:validate ------+--------> infra:plan ----+
```

Both build-stage jobs require all applicable validate-stage jobs. `infra:apply`
requires both build-stage jobs, `app:deploy` requires the successful apply and
the built bundle, and verification requires application deployment. A failed,
cancelled, or absent required prerequisite cannot be treated as release success.

## Event Policy

| Event                   | Validation/build behavior                                                                                                                                                                                                                                                                                                                  | Mutation behavior                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Pull request            | Run relevant application checks for application/content/workflow changes. Run infrastructure validation for infrastructure or shared deployment-automation changes. Run `infra:plan` only after the one-time bootstrap has established remote state and the OIDC plan role; rerun the initial infrastructure pull request after bootstrap. | Never enter `infra:apply` or `app:deploy`; never assume the production apply role.               |
| Push to `main`          | Rerun every release-relevant validate and build job against that exact commit and create a fresh production plan.                                                                                                                                                                                                                          | May enter the protected `production` environment only after all gates pass and a human approves. |
| Manual production rerun | Must reference a `main` revision and rerun applicable gates, build, and fresh plan.                                                                                                                                                                                                                                                        | Same protected environment, role, and approval rules as a push.                                  |

Path filters may avoid irrelevant pull-request infrastructure planning, but they
must not suppress a job required for an eligible production release. One
production concurrency group prevents overlapping plans/applies/deployments.

The first production run is enabled only after the implementation task set has
converged with the specification, full source-only validation is recorded, a
draft pull request has completed human review, and a human has integrated the
accepted revision into `main`. Feature-branch implementation tasks never trigger
or substitute for that post-review release lifecycle.

Before the initial pull request can produce its first shared-account plan, a
human may explicitly approve the documented one-time bootstrap outside CI from
the reviewed feature revision. Bootstrap establishes remote state, the OIDC
roles, certificate validation, initial empty static-delivery resources, and
one.com DNS records. It publishes no wiki bundle. After bootstrap, rerun the
pull-request workflow so `infra:plan` validates the resulting shared state before
merge. This exception does not authorize recurring out-of-CI infrastructure
changes.

## Job: `infra:validate`

Stage: `validate`

No AWS credentials are available. The job:

1. checks `terraform fmt -check -recursive`;
2. initializes each Terraform root with `-backend=false`;
3. runs `terraform validate -json`;
4. verifies the committed provider lock and static repository policy; and
5. publishes attributable formatting and validation reports.

It may download pinned providers but must not read or change deployed resources.
Provider installation may contact only the explicitly accepted public Terraform
Registry and provider distribution endpoints.

## Job: `app:validate`

Stage: `validate`

The job performs one `npm ci` from the committed lockfile and then:

1. runs strict TypeScript type checking;
2. runs ESLint with machine-readable reporting;
3. runs Prettier in check mode;
4. validates content schemas, references, provenance, visuals, ordering, and
   localization completeness/fallback detectability;
5. runs Vitest unit tests for functional domain requirements with JUnit and
   coverage output; and
6. runs `npm audit --json --audit-level=high` without mutating dependencies.

Each check retains a separate report even when later checks fail. High or
critical audit findings fail the job; lower findings remain reportable. The job
does not require Steam, the game installation, Python extraction dependencies,
AWS credentials, or a browser E2E service.
The install and audit steps may contact only the explicitly accepted public npm
registry; the unit tests and repository validators use committed local fixtures.

## Job: `app:build`

Stage: `build`

The job uses the exact validated revision and lockfile. It:

1. captures one UTC build date, reads the version from `webapp/package.json`, and
   uses the full workflow commit SHA;
2. validates and generates one release metadata object;
3. produces a production Vite build without changing source content;
4. verifies the bundle contains no source maps, secrets, raw extraction data,
   absolute source paths, or unapproved remote resources;
5. emits a manifest with SHA-256 checksums, the version, date, commit, and one
   valid tower route selected from the built dataset; and
6. uploads one immutable `wiki-bundle` artifact using repository-default
   retention.

The artifact is the only application input accepted by deployment. Deployment
must never run `npm run build` or regenerate release metadata.

## Job: `infra:plan`

Stage: `build`

For an eligible target, the job obtains short-lived credentials through the
non-resource-mutating GitHub OIDC plan role, configures the remote backend from
protected repository/environment variables, and creates a fresh production
plan. It:

1. verifies the workflow revision and Terraform lock data;
2. runs `terraform plan -out=production.tfplan` with non-secret environment
   inputs;
3. renders reviewable redacted text and JSON summaries;
4. creates a SHA-256 digest covering the binary plan, source revision, provider
   locks, and target workspace; and
5. uploads the binary plan and reports as restricted artifacts using repository-
   default retention.

Plans can contain operationally sensitive values and must never be committed,
published with the web bundle, or exposed in unrestricted logs. A plan performs
no managed-resource mutation. Native S3 backend operation is restricted to
listing the exact state prefix, getting and putting the exact state object, and
getting, putting, and deleting only its `.tflock` object. The role otherwise has
only the resource `Get`, `List`, and `Describe` actions required to refresh the
accepted Terraform scope; it cannot apply, publish, or invalidate.

## Job: `infra:apply`

Stage: `deploy`

This job is permitted only when all conditions are true:

- the revision belongs to `main`;
- both build-stage jobs succeeded for the same workflow run and commit;
- the protected `production` GitHub environment permits that branch;
- a required human reviewer explicitly approves the environment deployment;
- AWS bootstrap and one.com prerequisites are complete; and
- no other production mutation holds the concurrency group.

After approval, the job obtains short-lived credentials through the production
OIDC apply role, downloads only the plan artifact, and verifies its digest and
embedded revision. It applies exactly `production.tfplan` and does not download
or publish the application bundle.

## Job: `app:deploy`

Stage: `deploy`

This job runs only on `main` after `infra:apply` and `app:build` succeed for the
same workflow run and commit. It obtains short-lived credentials through the
production OIDC apply role, downloads and verifies the exact `wiki-bundle`, reads
the resulting Terraform outputs without planning or applying, and publishes only
to the resolved S3 application bucket. Fingerprinted assets receive immutable
cache metadata; `index.html`, content JSON, and `release.json` receive
revalidation metadata. Synchronization may delete stale deployment objects only
within that explicitly resolved bucket prefix. Finally it creates a narrowly
scoped CloudFront invalidation for mutable shell and JSON paths.

Together the two jobs record the approver, commit, artifact digest, plan digest,
Terraform result, distribution ID, and deployment time in GitHub deployment
records. Neither job rebuilds, edits DNS, uses static AWS keys, or bypasses a
failed gate, and `app:deploy` never calls `terraform apply`.

## Job: `infra:verify`

Stage: `verify`

After deployment, the job makes bounded, retrying public requests to:

- `https://nordhold.asperntallow.de/`;
- `https://nordhold.asperntallow.de/release.json`; and
- the valid stable tower route embedded in the bundle manifest.

It requires a trusted TLS connection, successful response, expected content
type, and release metadata whose version and full commit SHA exactly match the
promoted artifact. It also confirms the plain HTTP entry point redirects to
HTTPS. Retries cover bounded CloudFront propagation time; exhaustion fails the
release. The report contains no credentials or response body containing content
beyond the small release record.

## Credentials and Variables

No secret or account-specific value appears in source, bundles, artifacts meant
for the public, or Terraform defaults. The explicitly approved one-time
out-of-CI bootstrap uses the compatible account-wide GitHub OIDC provider and
supplies:

- separate Nordhold plan/apply roles that trust the existing provider;
- repository/environment variables for region, role ARNs, remote-state bucket
  and key, and non-secret project/environment values;
- a protected `production` environment restricted to `main` with required
  reviewer approval; and
- one.com certificate-validation and application CNAME records.

OIDC trust policies restrict audience, repository, branch/pull-request context,
and production environment subject. IAM permissions restrict state access,
Terraform resource scope, application-bucket publication, and CloudFront
invalidation. If the GitHub plan does not support required environment reviewers,
production deployment stays disabled until an equivalent explicitly approved
control is designed and documented.

## Artifact and Rollback Rules

- The web bundle and saved plan have distinct names and access expectations.
- Digests are checked before use, and all artifacts identify one exact commit.
- Workflow artifacts use repository-default retention; this feature defines no
  custom retention or recovery-time target.
- A release is successful only after `infra:verify` passes.
- The constitution-required minimal rollback procedure reverts to a known
  successful source revision and runs a newly validated workflow with a fresh
  Terraform plan and production approval. Operators do not hand-edit S3 or
  Terraform state.
- Failed application publication remains visibly failed and is escalated to an
  authorized operator; the documented rollback procedure is used if approved.

## Required Reporting

GitHub's run summary links every job result and artifact so a reviewer can trace:

```text
commit -> validation reports -> bundle digest + plan digest
       -> human approval -> apply + publish record -> smoke result
```

Routine CI includes no component, browser E2E, visual-regression, performance,
accessibility, broad UX, or live AWS integration automated test suite. The
narrowly scoped post-deployment smoke check is an operational verification and
the sole accepted routine live-environment exception.
