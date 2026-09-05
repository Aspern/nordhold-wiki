output "application_bucket_name" {
  description = "Exact private bucket accepted by the application deployment job."
  value       = aws_s3_bucket.application.id
}

output "cloudfront_distribution_id" {
  description = "Exact distribution accepted for targeted invalidation."
  value       = aws_cloudfront_distribution.wiki.id
}

output "cloudfront_distribution_arn" {
  description = "Distribution ARN used by the origin bucket policy."
  value       = aws_cloudfront_distribution.wiki.arn
}

output "cloudfront_domain_name" {
  description = "CNAME target a human must configure for nordhold at one.com."
  value       = aws_cloudfront_distribution.wiki.domain_name
}

output "public_domain_name" {
  description = "Expected public hostname after the one.com CNAME is configured."
  value       = var.domain_name
}

output "unsupported_tagging_resources" {
  description = "CloudFront resource types in this configuration that do not expose tags."
  value = [
    "aws_cloudfront_cache_policy.immutable",
    "aws_cloudfront_cache_policy.revalidate",
    "aws_cloudfront_function.route_rewrite",
    "aws_cloudfront_origin_access_control.wiki",
    "aws_cloudfront_response_headers_policy.security",
  ]
}
