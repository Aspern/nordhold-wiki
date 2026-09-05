# Nordhold Wiki

Nordhold Wiki is a community knowledge base for the computer game
[Nordhold](https://stunforge.com/index.php/nordhold/).

The repository is currently an initial project scaffold. Product features and
bug fixes are developed with GitHub Spec Kit and its Codex integration.

## Project Scope

- `webapp/` contains the static web application.
- `infra/` contains Terraform infrastructure for publishing the application to
  an AWS account through Amazon CloudFront.
- Wiki content is stored as version-controlled JSON files and shipped with the
  web application.
- The application has no database and no runtime content-management backend.

Frontend technology, content schemas, AWS environments, and delivery automation
will be defined through accepted Spec Kit features rather than being selected by
the repository bootstrap.

## Development Workflow

Read `AGENTS.md` and `CONTRIBUTING.md` before making changes. Persistent project
artifacts are written in English. Product work uses the Spec Kit feature
workflow; confirmed defects use the installed Spec Kit bug workflow.

The integration branch is `main`. Changes are developed on dedicated branches
and integrated through pull requests.

## Repository Status

This initial scaffold intentionally does not contain an application framework or
deployable Terraform configuration yet. Those choices require explicit feature
requirements and review.
