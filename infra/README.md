# Nordhold Wiki Infrastructure Runbook

Terraform defines the AWS bootstrap and production delivery resources for the
static Nordhold wiki. It does not manage one.com. Nothing in this runbook grants
permission to change AWS or DNS: obtain fresh human approval after reviewing the
target account, regions, state location, and exact plan before every plan,
apply, state migration, recovery operation, or DNS edit.

## Architecture and Boundaries

- `bootstrap/` owns the encrypted versioned state bucket, Nordhold-specific
  plan/apply roles, and the ACM certificate request in `us-east-1`. It discovers
  the existing account-wide GitHub OIDC provider by its canonical URL and does
  not create, modify, or destroy that shared provider.
- `production/` owns the private versioned S3 application origin, CloudFront OAC,
  distribution, route function, cache policies, and security headers.
- one.com remains authoritative for `asperntallow.de`. A human creates the ACM
  validation CNAME and the `nordhold` application CNAME there.
- CloudFront is the only public read path. S3 public access is blocked and its
  bucket policy grants only signed CloudFront reads. Neither root creates a
  database, server, analytics service, WAF, Route 53 zone, or logging pipeline.

Terraform CLI `1.16.1` and the checksummed `hashicorp/aws` provider `6.63.0` are
locked. Provider setup may contact only the approved Terraform registry and
HashiCorp distribution endpoints. State, plans, backend configuration, real
variable files, account identifiers, and credentials are ignored and must never
be committed.

## Safe Source Validation

These commands download the locked provider but use no AWS credentials, backend,
or deployed resource:

```powershell
terraform fmt -check -recursive .\infra
terraform -chdir=.\infra\bootstrap init -backend=false -lockfile=readonly
terraform -chdir=.\infra\bootstrap validate
terraform -chdir=.\infra\production init -backend=false -lockfile=readonly
terraform -chdir=.\infra\production validate
```

## One-Time Human-Assisted Bootstrap

This procedure is blocked until implementation convergence, complete local
validation, draft pull-request review, and explicit approval of the exact AWS
account and plans. It must not upload a wiki bundle.

The target account must already contain exactly one GitHub Actions OIDC provider
for `https://token.actions.githubusercontent.com`, and its client IDs must
include `sts.amazonaws.com`. The provider is an account-level prerequisite
managed outside this repository. Stop if it is absent, duplicated, or has an
unexpected audience; do not create a second provider from this bootstrap root.

1. Create an ignored `infra/bootstrap/bootstrap.auto.tfvars` with only the
   reviewed non-secret inputs:

   ```hcl
   application_bucket_name = "GLOBALLY_UNIQUE_APPLICATION_BUCKET"
   cost_owner         = "REVIEWED_COST_OWNER"
   github_repository  = "OWNER/REPOSITORY"
   state_bucket_name  = "GLOBALLY_UNIQUE_STATE_BUCKET"
   ```

2. Confirm the authenticated account and planned regions before continuing:

   ```powershell
   aws sts get-caller-identity
   aws configure get region
   ```

   The state bucket and IAM resources belong in `eu-central-1`; only ACM belongs
   in `us-east-1`. Stop if the account or identity differs from the approved
   target.

3. Initialize the bootstrap root locally, save a plan, and inspect every action.
   The plan must read the existing GitHub OIDC provider and must contain no
   provider create, update, replacement, or deletion. Obtain approval
   immediately before apply:

   ```powershell
   terraform -chdir=.\infra\bootstrap init -backend=false
   terraform -chdir=.\infra\bootstrap plan -out=bootstrap.tfplan
   terraform -chdir=.\infra\bootstrap show -no-color bootstrap.tfplan
   terraform -chdir=.\infra\bootstrap apply bootstrap.tfplan
   terraform -chdir=.\infra\bootstrap output
   ```

4. Create an ignored `infra/bootstrap/backend.hcl` from the non-secret outputs:

   ```hcl
   bucket = "STATE_BUCKET_OUTPUT"
   key    = "bootstrap/terraform.tfstate"
   region = "eu-central-1"
   ```

   Review the exact bucket and key, then migrate the local state and verify the
   native lockfile backend:

   ```powershell
   terraform -chdir=.\infra\bootstrap init -migrate-state -backend-config=backend.hcl
   terraform -chdir=.\infra\bootstrap state pull | Out-Null
   ```

5. At one.com, add every name/type/value from
   `certificate_validation_records`. Keep those CNAME records permanently so ACM
   can renew the certificate. Wait until ACM reports `ISSUED`, then place the
   exact certificate ARN in protected GitHub configuration.

6. Configure these protected repository or production-environment variables:
   `AWS_REGION`, `AWS_STATE_BUCKET`, `AWS_PRODUCTION_STATE_KEY`,
   `AWS_PLAN_ROLE_ARN`, `AWS_APPLY_ROLE_ARN`, `AWS_CERTIFICATE_ARN`,
   `AWS_APPLICATION_BUCKET`, `AWS_COST_OWNER`, and `BOOTSTRAP_COMPLETE`.
   Configure a `production` GitHub environment restricted to `main` with a
   required human reviewer. If the repository plan cannot enforce that reviewer,
   keep deployment disabled.

7. Create ignored `infra/production/backend.hcl` and
   `infra/production/production.auto.tfvars` files from the same reviewed values:

   ```hcl
   # backend.hcl
   bucket = "STATE_BUCKET_OUTPUT"
   key    = "production/terraform.tfstate"
   region = "eu-central-1"

   # production.auto.tfvars
   application_bucket_name = "GLOBALLY_UNIQUE_APPLICATION_BUCKET"
   certificate_arn         = "ISSUED_US_EAST_1_CERTIFICATE_ARN"
   cost_owner              = "REVIEWED_COST_OWNER"
   ```

8. Initialize production, save and inspect a fresh plan, obtain approval, and
   apply only the empty delivery infrastructure:

   ```powershell
   terraform -chdir=.\infra\production init -backend-config=backend.hcl
   terraform -chdir=.\infra\production plan -out=production.tfplan
   terraform -chdir=.\infra\production show -no-color production.tfplan
   terraform -chdir=.\infra\production apply production.tfplan
   terraform -chdir=.\infra\production output
   ```

9. At one.com, add `nordhold` as a CNAME to the exact
   `cloudfront_domain_name` output. Verify that the application bucket remains
   private, all supported resources carry the standard tags, HTTPS uses the
   issued certificate, HTTP redirects to HTTPS, and direct origin access fails.
   The empty bootstrap does not constitute an application release.

10. Set `BOOTSTRAP_COMPLETE=true`, rerun the pull-request workflow, and review
    the non-mutating `infra:plan`. Production remains blocked until a human
    accepts and merges the pull request.

## CI Deployment and Caching

The protected workflow applies the exact saved production plan, then promotes
the already checksummed application artifact. It never rebuilds during deploy.
It resolves the bucket and distribution from Terraform outputs and refuses a
bucket that differs from protected configuration.

Fingerprint assets under `/assets/` receive a one-year immutable cache policy.
`index.html`, `/content/*`, and `/release.json` revalidate. Deployment invalidates
only `/index.html`, `/release.json`, and `/content/*`; it does not issue a broad
distribution invalidation. Stale objects may be removed only by the scoped sync
inside the resolved application bucket and asset prefix.

The cost baseline contains no continuously running compute. Primary drivers are
S3 storage and retained object versions, CloudFront requests and transfer,
invalidation usage beyond the included allowance, and GitHub Actions. CloudFront
uses `PriceClass_100`. Review current provider pricing before the first apply;
this runbook intentionally states no durable currency estimate.

## State Locking and Recovery

Both state keys use S3 native `.tflock` objects. Never bypass a live lock until
the owning run is identified and confirmed dead. The CI policies can delete only
the two exact lock objects and cannot delete state. Never run concurrent
production mutations.

The state bucket has versioning and `prevent_destroy`. For suspected corruption:

1. stop CI and all Terraform operators;
2. inspect the exact state-object version history without changing it;
3. compare the current and candidate prior version with the affected plan and
   audit record;
4. obtain explicit break-glass approval for the exact version restoration;
5. restore that reviewed S3 object version using an authorized operator;
6. run `terraform state pull`, `terraform plan -refresh-only`, and then a normal
   fresh plan before resuming changes.

Do not edit state JSON, invent resources with state commands, delete the bucket,
or restore a version merely to make a plan quiet. This project defines no custom
retention period or recovery-time target.

## Release Failure and Rollback

A release is successful only after `infra:verify` confirms trusted HTTPS, the
root, the manifest-selected tower route, HTTP-to-HTTPS redirect, and exact
release version/SHA. If publication or verification fails, leave the run failed
and escalate to an authorized operator.

Rollback means reverting to a previously successful source revision and running
the entire validation, fresh Terraform plan, protected approval, deployment, and
verification workflow again. Do not hand-edit S3 objects, CloudFront settings,
or Terraform state. No recovery-time objective or retained-artifact window is
introduced by this procedure.
