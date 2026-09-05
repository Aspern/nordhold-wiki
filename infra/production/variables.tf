variable "aws_region" {
  description = "AWS region for the private application origin."
  type        = string
  default     = "eu-central-1"

  validation {
    condition     = var.aws_region == "eu-central-1"
    error_message = "The production application region must remain eu-central-1."
  }
}

variable "project" {
  description = "Stable project tag and resource-name prefix."
  type        = string
  default     = "nordhold-wiki"
}

variable "environment" {
  description = "Environment tag for delivery resources."
  type        = string
  default     = "production"
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
  description = "Public CloudFront alias for the wiki."
  type        = string
  default     = "nordhold.asperntallow.de"

  validation {
    condition     = var.domain_name == "nordhold.asperntallow.de"
    error_message = "This production root is scoped to nordhold.asperntallow.de."
  }
}

variable "application_bucket_name" {
  description = "Globally unique private S3 origin bucket name."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.application_bucket_name))
    error_message = "application_bucket_name must be a valid globally unique S3 bucket name."
  }
}

variable "certificate_arn" {
  description = "Issued us-east-1 ACM certificate ARN from the approved bootstrap."
  type        = string

  validation {
    condition     = can(regex("^arn:[^:]+:acm:us-east-1:[0-9]{12}:certificate/[0-9a-f-]+$", var.certificate_arn))
    error_message = "certificate_arn must identify a us-east-1 ACM certificate."
  }
}
