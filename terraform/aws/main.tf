# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.tags, {
      Project     = var.project_name
      ManagedBy   = "terraform"
      Component   = "email-ses"
    })
  }
}

# Local values for computed configurations
locals {
  # Add the primary domain to verified domains if not already included
  verified_domains = length(var.ses_verified_domains) > 0 ? var.ses_verified_domains : [var.domain]
  
  # Common tags for all resources
  common_tags = merge(var.tags, {
    Project   = var.project_name
    ManagedBy = "terraform"
    Component = "email-ses"
  })
}