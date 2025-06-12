# SES Domain Identity Verification
resource "aws_ses_domain_identity" "domain" {
  for_each = toset(local.verified_domains)
  domain   = each.value
}

# SES Domain DKIM Verification
resource "aws_ses_domain_dkim" "domain_dkim" {
  for_each = aws_ses_domain_identity.domain
  domain   = each.value.domain
}

# SES Domain Mail From
resource "aws_ses_domain_mail_from" "domain_mail_from" {
  for_each         = aws_ses_domain_identity.domain
  domain           = each.value.domain
  mail_from_domain = "mail.${each.value.domain}"
}

# SES Email Identity Verification (for sandbox mode testing)
resource "aws_ses_email_identity" "email" {
  for_each = toset(var.ses_verified_emails)
  email    = each.value
}

# SES Configuration Set
resource "aws_ses_configuration_set" "main" {
  name = "${var.project_name}-email-config"

  delivery_options {
    tls_policy = "Require"
  }

  reputation_metrics_enabled = true
}

# SES Event Destination for Configuration Set (CloudWatch)
resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-destination"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true
  matching_types         = ["send", "bounce", "complaint", "delivery", "reject"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "MessageTag"
    value_source   = "messageTag"
  }
}

# SES Receipt Rule Set (for incoming email handling)
resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "${var.project_name}-receipt-rules"
}

# Activate the receipt rule set
resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

# IAM Policy for SES sending
data "aws_iam_policy_document" "ses_sending_policy" {
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
      "ses:GetSendQuota",
      "ses:GetSendStatistics",
      "ses:ListIdentities",
      "ses:GetIdentityVerificationAttributes",
      "ses:GetIdentityDkimAttributes",
      "ses:GetIdentityPolicies",
      "ses:GetIdentityNotificationAttributes"
    ]
    resources = ["*"]
  }
}

# IAM Policy
resource "aws_iam_policy" "ses_sending" {
  count       = var.create_smtp_user ? 1 : 0
  name        = "${var.project_name}-ses-sending-policy"
  description = "Policy for SES email sending"
  policy      = data.aws_iam_policy_document.ses_sending_policy.json
}

# IAM User for SMTP authentication
resource "aws_iam_user" "smtp_user" {
  count = var.create_smtp_user ? 1 : 0
  name  = "${var.project_name}-${var.smtp_user_name}"
  path  = "/ses/"

  tags = local.common_tags
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "smtp_user_policy" {
  count      = var.create_smtp_user ? 1 : 0
  user       = aws_iam_user.smtp_user[0].name
  policy_arn = aws_iam_policy.ses_sending[0].arn
}

# Create access key for SMTP user
resource "aws_iam_access_key" "smtp_user" {
  count = var.create_smtp_user ? 1 : 0
  user  = aws_iam_user.smtp_user[0].name
}

# Data source to get the SES SMTP password
# Note: The SMTP password is derived from the secret access key using AWS's algorithm
data "external" "smtp_password" {
  count = var.create_smtp_user ? 1 : 0
  program = ["python3", "-c", <<-EOT
import hashlib
import hmac
import base64
import json
import sys

# AWS SES SMTP password derivation
def derive_smtp_password(secret_access_key, region):
    message = "SendRawEmail"
    version = 0x04
    
    signature = hmac.new(
        key=(version.to_bytes(1, byteorder="big") + secret_access_key.encode("utf-8")),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256
    ).digest()
    
    return base64.b64encode(signature).decode("utf-8")

# Read input from terraform
input_data = json.loads(sys.stdin.read())
secret_key = input_data['secret_key']
region = input_data['region']

smtp_password = derive_smtp_password(secret_key, region)
print(json.dumps({"smtp_password": smtp_password}))
EOT
  ]

  query = var.create_smtp_user ? {
    secret_key = aws_iam_access_key.smtp_user[0].secret
    region     = var.aws_region
  } : {}
}