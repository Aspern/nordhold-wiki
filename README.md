# Nordhold Wiki

Nordhold Wiki is a public community knowledge base for the computer game
[Nordhold](https://stunforge.com/index.php/nordhold/). The initial release is a
static, bilingual tower and banner catalogue intended for
`https://nordhold.asperntallow.de`.

## Project Scope

- `webapp/` contains the strict TypeScript Vue/Vuetify SPA, static JSON content,
  original CSS banner visuals, authorized tower sprites, build tools, and
  functional unit tests.
- `infra/bootstrap/` defines remote state, GitHub OIDC roles, and the
  `us-east-1` ACM certificate request.
- `infra/production/` defines the private S3 origin and CloudFront delivery.
- `.github/workflows/wiki-platform.yml` defines the exact validate, build,
  approved deploy, and verify chain.
- `specs/001-initial-wiki-platform/` contains the accepted specification, plan,
  contracts, task list, inventory, quickstart, and validation evidence.

The application has no database, backend, runtime CMS, accounts, analytics, or
tracking. Wiki facts are checked-in JSON and the browser never needs a game
installation, Python, AWS credentials, or a content service.

## Visitor Routes

- `/` shows and filters every active tower.
- `/towers/:towerId` directly opens the stable tower record and groups exactly
  its tower-specific, generalist, unique, and fusion banners.
- Unknown or malformed paths render a safe localized not-found view.

Browser language negotiation supports English and German with English fallback.
Release version and UTC build date appear on every view.

## Development Workflow

Read `AGENTS.md` and `CONTRIBUTING.md` before making changes. Persistent project
artifacts are written in English. Product work uses the Spec Kit feature
workflow; confirmed defects use the installed Spec Kit bug workflow.

The integration branch is `main`. Changes are developed on dedicated branches
and integrated through pull requests.

Application setup, content boundaries, tests, theme rules, and build inputs are
documented in `webapp/README.md`. AWS bootstrap, DNS coordination, state
recovery, caching, deployment, cost boundaries, and rollback are documented in
`infra/README.md`. Terraform source validation is safe without credentials;
every AWS plan/apply or one.com edit still requires explicit human approval.
