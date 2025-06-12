# AWS Region Configuration
variable "aws_region" {
  description = "AWS region for SES configuration"
  type        = string
  default     = "us-east-1"  # SES is available in limited regions
}

# Domain Configuration
variable "domain" {
  description = "Primary domain for email configuration"
  type        = string
}

# Project Configuration
variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
}

# SES Configuration
variable "ses_verified_domains" {
  description = "List of domains to verify with SES"
  type        = list(string)
  default     = []
}

variable "ses_verified_emails" {
  description = "List of email addresses to verify with SES (for sandbox mode)"
  type        = list(string)
  default     = []
}

variable "ses_production_access" {
  description = "Request production access for SES (removes sandbox limitations)"
  type        = bool
  default     = false
}

# SMTP Configuration
variable "create_smtp_user" {
  description = "Create IAM user for SMTP authentication"
  type        = bool
  default     = true
}

variable "smtp_user_name" {
  description = "Name for the SMTP IAM user"
  type        = string
  default     = "ses-smtp-user"
}

# Tagging
variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}