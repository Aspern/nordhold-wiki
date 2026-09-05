locals {
  bootstrap_state_arn       = "${aws_s3_bucket.terraform_state.arn}/${var.bootstrap_state_key}"
  production_state_arn      = "${aws_s3_bucket.terraform_state.arn}/${var.production_state_key}"
  github_repository_parts   = split("/", var.github_repository)
  github_oidc_repository_id = "${local.github_repository_parts[0]}@${var.github_repository_owner_id}/${local.github_repository_parts[1]}@${var.github_repository_id}"
  state_object_arns = [
    local.bootstrap_state_arn,
    "${local.bootstrap_state_arn}.tflock",
    local.production_state_arn,
    "${local.production_state_arn}.tflock",
  ]
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "plan_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.github_oidc_repository_id}:pull_request",
        "repo:${local.github_oidc_repository_id}:ref:refs/heads/main",
      ]
    }
  }
}

data "aws_iam_policy_document" "apply_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_oidc_repository_id}:environment:production"]
    }
  }
}

resource "aws_iam_role" "plan" {
  name               = "${var.project}-plan"
  assume_role_policy = data.aws_iam_policy_document.plan_assume_role.json
}

resource "aws_iam_role" "apply" {
  name               = "${var.project}-apply"
  assume_role_policy = data.aws_iam_policy_document.apply_assume_role.json
}

data "aws_iam_policy_document" "state_access" {
  statement {
    sid       = "ListExactStateKeys"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.terraform_state.arn]

    condition {
      test     = "StringEquals"
      variable = "s3:prefix"
      values = [
        var.bootstrap_state_key,
        "${var.bootstrap_state_key}.tflock",
        var.production_state_key,
        "${var.production_state_key}.tflock",
      ]
    }
  }

  statement {
    sid       = "ReadWriteExactStateObjects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = local.state_object_arns
  }

  statement {
    sid     = "DeleteOnlyLockfiles"
    effect  = "Allow"
    actions = ["s3:DeleteObject"]
    resources = [
      "${local.bootstrap_state_arn}.tflock",
      "${local.production_state_arn}.tflock",
    ]
  }
}

resource "aws_iam_role_policy" "plan_state" {
  name   = "exact-terraform-state"
  role   = aws_iam_role.plan.id
  policy = data.aws_iam_policy_document.state_access.json
}

resource "aws_iam_role_policy" "apply_state" {
  name   = "exact-terraform-state"
  role   = aws_iam_role.apply.id
  policy = data.aws_iam_policy_document.state_access.json
}

data "aws_iam_policy_document" "plan_read" {
  statement {
    sid    = "ListProductionResources"
    effect = "Allow"
    actions = [
      "cloudfront:List*",
      "s3:ListAllMyBuckets",
      "sts:GetCallerIdentity",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ReadCloudFrontAndCertificate"
    effect = "Allow"
    actions = [
      "acm:DescribeCertificate",
      "acm:ListTagsForCertificate",
      "cloudfront:Get*",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ReadApplicationOrigin"
    effect = "Allow"
    actions = [
      "s3:GetAccelerateConfiguration",
      "s3:GetBucket*",
      "s3:GetEncryptionConfiguration",
      "s3:GetLifecycleConfiguration",
      "s3:GetObjectAttributes",
      "s3:ListBucket",
      "s3:ListBucketVersions",
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${var.application_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${var.application_bucket_name}/*",
    ]
  }
}

resource "aws_iam_role_policy" "plan_read" {
  name   = "read-production-resources"
  role   = aws_iam_role.plan.id
  policy = data.aws_iam_policy_document.plan_read.json
}

data "aws_iam_policy_document" "apply_resources" {
  statement {
    sid       = "CreateApplicationBucket"
    effect    = "Allow"
    actions   = ["s3:CreateBucket"]
    resources = ["*"]
  }

  statement {
    sid    = "ManageApplicationBucket"
    effect = "Allow"
    actions = [
      "s3:DeleteBucket",
      "s3:DeleteBucketPolicy",
      "s3:DeleteObject",
      "s3:Get*",
      "s3:List*",
      "s3:PutBucketPolicy",
      "s3:PutBucketPublicAccessBlock",
      "s3:PutBucketTagging",
      "s3:PutBucketVersioning",
      "s3:PutEncryptionConfiguration",
      "s3:PutObject",
      "s3:PutObjectTagging",
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${var.application_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${var.application_bucket_name}/*",
    ]
  }

  statement {
    sid       = "ManageCloudFrontDelivery"
    effect    = "Allow"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  statement {
    sid       = "ReadCertificate"
    effect    = "Allow"
    actions   = ["acm:DescribeCertificate", "acm:ListTagsForCertificate"]
    resources = [aws_acm_certificate.wiki.arn]
  }
}

resource "aws_iam_role_policy" "apply_resources" {
  name   = "manage-wiki-delivery"
  role   = aws_iam_role.apply.id
  policy = data.aws_iam_policy_document.apply_resources.json
}
