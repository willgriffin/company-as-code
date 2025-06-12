# SES Domain verification outputs
output "ses_domain_identities" {
  description = "SES domain identities that need DNS verification"
  value = {
    for domain, identity in aws_ses_domain_identity.domain : domain => {
      verification_token = identity.verification_token
      arn               = identity.arn
    }
  }
}

# DKIM tokens for DNS configuration
output "ses_dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records"
  value = {
    for domain, dkim in aws_ses_domain_dkim.domain_dkim : domain => {
      dkim_tokens = dkim.dkim_tokens
    }
  }
}

# Mail-from domain MX record
output "ses_mail_from_mx_records" {
  description = "MX records needed for mail-from domains"
  value = {
    for domain, mail_from in aws_ses_domain_mail_from.domain_mail_from : domain => {
      mail_from_domain = mail_from.mail_from_domain
      mx_record       = "10 feedback-smtp.${var.aws_region}.amazonses.com"
    }
  }
}

# SES SMTP configuration
output "ses_smtp_endpoint" {
  description = "SES SMTP endpoint for the configured region"
  value       = "email-smtp.${var.aws_region}.amazonaws.com"
}

output "ses_smtp_port" {
  description = "SES SMTP port (587 for STARTTLS, 465 for TLS)"
  value       = 587
}

# SMTP credentials (sensitive)
output "smtp_username" {
  description = "SMTP username (IAM access key ID)"
  value       = var.create_smtp_user ? aws_iam_access_key.smtp_user[0].id : null
  sensitive   = true
}

output "smtp_password" {
  description = "SMTP password (derived from IAM secret key)"
  value       = var.create_smtp_user ? data.external.smtp_password[0].result.smtp_password : null
  sensitive   = true
}

# Configuration set
output "ses_configuration_set" {
  description = "SES configuration set name"
  value       = aws_ses_configuration_set.main.name
}

# DNS records needed for verification
output "dns_records_needed" {
  description = "DNS records that need to be created for SES verification"
  value = {
    # Domain verification TXT records
    domain_verification = {
      for domain, identity in aws_ses_domain_identity.domain : domain => {
        type  = "TXT"
        name  = "_amazonses.${domain}"
        value = identity.verification_token
      }
    }
    
    # DKIM CNAME records
    dkim_records = {
      for domain, dkim in aws_ses_domain_dkim.domain_dkim : domain => [
        for token in dkim.dkim_tokens : {
          type  = "CNAME"
          name  = "${token}._domainkey.${domain}"
          value = "${token}.dkim.amazonses.com"
        }
      ]
    }
    
    # Mail-from MX records
    mail_from_mx = {
      for domain, mail_from in aws_ses_domain_mail_from.domain_mail_from : domain => {
        type  = "MX"
        name  = mail_from.mail_from_domain
        value = "10 feedback-smtp.${var.aws_region}.amazonses.com"
      }
    }
  }
}

# Summary for easy reference
output "setup_summary" {
  description = "Summary of SES setup and next steps"
  value = {
    region                = var.aws_region
    smtp_endpoint        = "email-smtp.${var.aws_region}.amazonaws.com"
    smtp_port           = 587
    configuration_set   = aws_ses_configuration_set.main.name
    verified_domains    = local.verified_domains
    smtp_user_created   = var.create_smtp_user
    production_access   = var.ses_production_access
    next_steps = [
      "1. Create the DNS records listed in 'dns_records_needed' output",
      "2. Wait for domain verification (can take up to 72 hours)",
      "3. If needed, request production access through AWS console",
      "4. Configure Mailu to use the SMTP credentials",
      "5. Test email sending functionality"
    ]
  }
}