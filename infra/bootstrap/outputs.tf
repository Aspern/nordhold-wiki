output "state_bucket_name" {
  description = "Remote-state bucket name for protected CI configuration."
  value       = aws_s3_bucket.terraform_state.id
}

output "bootstrap_state_key" {
  description = "Remote key used when migrating bootstrap state."
  value       = var.bootstrap_state_key
}

output "production_state_key" {
  description = "Remote key used by the production root."
  value       = var.production_state_key
}

output "plan_role_arn" {
  description = "GitHub OIDC role ARN for non-mutating Terraform plans."
  value       = aws_iam_role.plan.arn
}

output "apply_role_arn" {
  description = "GitHub OIDC role ARN for protected production applies and publication."
  value       = aws_iam_role.apply.arn
}

output "certificate_arn" {
  description = "ACM certificate ARN passed to the production root after issuance."
  value       = aws_acm_certificate.wiki.arn
}

output "certificate_validation_records" {
  description = "CNAME records a human must add at one.com and retain for ACM renewal."
  value = [
    for option in aws_acm_certificate.wiki.domain_validation_options : {
      name  = option.resource_record_name
      type  = option.resource_record_type
      value = option.resource_record_value
    }
  ]
}
