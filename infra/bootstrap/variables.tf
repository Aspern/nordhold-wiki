variable "aws_region" {
  description = "AWS region for the Terraform state bucket and IAM resources."
  type        = string
  default     = "eu-central-1"

  validation {
    condition     = var.aws_region == "eu-central-1"
    error_message = "The bootstrap region must remain eu-central-1."
  }
}

variable "project" {
  description = "Stable project tag and resource-name prefix."
  type        = string
  default     = "nordhold-wiki"
}

variable "environment" {
  description = "Environment tag for bootstrap resources."
  type        = string
  default     = "bootstrap"
}

variable "cost_owner" {
  description = "Non-secret cost allocation owner tag."
  type        = string

  validation {
    condition     = length(trimspace(var.cost_owner)) > 0
    error_message = "cost_owner must not be empty."
  }
}

variable "domain_name" {
  description = "Public wiki domain covered by the CloudFront certificate."
  type        = string
  default     = "nordhold.asperntallow.de"

  validation {
    condition     = var.domain_name == "nordhold.asperntallow.de"
    error_message = "This bootstrap is scoped to nordhold.asperntallow.de."
  }
}

variable "state_bucket_name" {
  description = "Globally unique name for the Terraform state bucket."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.state_bucket_name))
    error_message = "state_bucket_name must be a valid globally unique S3 bucket name."
  }
}

variable "application_bucket_name" {
  description = "Planned globally unique private application bucket, used to scope CI policies."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.application_bucket_name))
    error_message = "application_bucket_name must be a valid globally unique S3 bucket name."
  }
}

variable "bootstrap_state_key" {
  description = "Exact remote key used after migrating bootstrap state."
  type        = string
  default     = "bootstrap/terraform.tfstate"
}

variable "production_state_key" {
  description = "Exact remote key used by the production Terraform root."
  type        = string
  default     = "production/terraform.tfstate"
}

variable "github_repository" {
  description = "GitHub owner/repository allowed to request AWS OIDC sessions."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "github_repository must use owner/repository form."
  }
}

variable "github_repository_owner_id" {
  description = "Stable numeric GitHub owner ID used by the organization OIDC subject template."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_owner_id))
    error_message = "github_repository_owner_id must be a numeric GitHub owner ID."
  }
}

variable "github_repository_id" {
  description = "Stable numeric GitHub repository ID used by the organization OIDC subject template."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_id))
    error_message = "github_repository_id must be a numeric GitHub repository ID."
  }
}
