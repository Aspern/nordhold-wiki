# Infrastructure

This module will contain Terraform configuration for publishing the static web
application to an AWS account through Amazon CloudFront, including only the
supporting AWS resources required by accepted specifications.

Terraform plans may be prepared and reviewed locally. Provisioning, modifying,
or destroying AWS resources requires explicit human approval.

Environment layout, remote state, DNS, certificates, access controls, delivery
automation, and rollback behavior will be defined through the Spec Kit workflow
before implementation.
