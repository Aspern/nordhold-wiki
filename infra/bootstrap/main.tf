provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      Service     = "wiki-platform"
      CostOwner   = var.cost_owner
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      Service     = "wiki-platform"
      CostOwner   = var.cost_owner
    }
  }
}

data "aws_partition" "current" {}

# Bootstrap starts with `terraform init -backend=false` because the state bucket
# does not exist yet. After the approved first apply, migrate with the exact
# `state_bucket_name`, `bootstrap_state_key`, and `aws_region` outputs supplied as
# protected partial S3 backend configuration. Never commit backend.hcl or state.
