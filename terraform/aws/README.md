# AWS SES Terraform Configuration

This directory contains Terraform configuration for setting up AWS Simple Email Service (SES) to provide SMTP relay for outgoing email from the Mailu email server.

## Overview

This configuration sets up:
- SES domain identity verification
- DKIM authentication for domains
- Mail-from domain configuration
- IAM user with SMTP credentials
- SES configuration set for monitoring
- CloudWatch event destinations

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI with credentials
3. **Domain Access**: You need to be able to modify DNS records for your domain

## Quick Start

1. **Copy configuration files**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   cp backend-config.hcl.example backend-config.hcl
   ```

2. **Edit configuration**:
   ```bash
   # Edit terraform.tfvars with your domain and project settings
   vi terraform.tfvars
   
   # Edit backend-config.hcl with your state backend settings
   vi backend-config.hcl
   ```

3. **Set AWS credentials**:
   ```bash
   # Option 1: AWS CLI configuration
   aws configure
   
   # Option 2: Environment variables
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_DEFAULT_REGION="us-east-1"
   ```

4. **Initialize and apply**:
   ```bash
   terraform init -backend-config=backend-config.hcl
   terraform plan
   terraform apply
   ```

## Configuration Variables

### Required Variables

- `domain`: Your primary domain (e.g., "example.com")
- `project_name`: Project name for resource tagging
- `aws_region`: AWS region (us-east-1 recommended for SES)

### Optional Variables

- `ses_verified_domains`: Additional domains to verify
- `ses_verified_emails`: Email addresses to verify for sandbox testing
- `ses_production_access`: Request production access (removes sandbox limits)
- `create_smtp_user`: Create IAM user for SMTP authentication
- `smtp_user_name`: Name for the SMTP IAM user
- `tags`: Additional resource tags

## DNS Configuration

After applying Terraform, you'll need to create DNS records for domain verification:

1. **Get DNS records**:
   ```bash
   terraform output dns_records_needed
   ```

2. **Create the following DNS records**:
   - **TXT record** for domain verification: `_amazonses.yourdomain.com`
   - **CNAME records** for DKIM (3 records per domain)
   - **MX record** for mail-from domain: `mail.yourdomain.com`

3. **Wait for verification**: Domain verification can take up to 72 hours

## SMTP Configuration

After successful setup, use these settings in Mailu:

```bash
# Get SMTP configuration
terraform output setup_summary
```

The output will include:
- **SMTP Server**: `email-smtp.{region}.amazonaws.com`
- **SMTP Port**: `587` (STARTTLS) or `465` (TLS)
- **Username**: IAM Access Key ID
- **Password**: Derived SMTP password

## Sandbox vs Production

### Sandbox Mode (Default)
- Limited to 200 emails/day
- Only verified email addresses can receive emails
- Perfect for testing

### Production Access
- Set `ses_production_access = true` in terraform.tfvars
- Requires manual approval from AWS (can take 24-48 hours)
- Removes sending limits and recipient restrictions

## Monitoring

The configuration includes:
- CloudWatch event destinations for email metrics
- Configuration set for tracking delivery, bounces, complaints

Monitor your email sending through:
- AWS CloudWatch Console
- SES Console → Reputation dashboard
- SES Console → Configuration sets

## Security Best Practices

1. **IAM Permissions**: The created IAM user has minimal required permissions
2. **Credential Rotation**: Regularly rotate the SMTP credentials
3. **State Security**: Secure your Terraform state backend
4. **Network Security**: Use TLS for all SMTP connections

## Integration with Mailu

Update your Mailu configuration to use SES SMTP:

```yaml
# In Mailu configuration
SMTP_HOST: "email-smtp.{region}.amazonaws.com"
SMTP_PORT: "587"
SMTP_USERNAME: "{iam-access-key-id}"
SMTP_PASSWORD: "{derived-smtp-password}"
SMTP_USE_TLS: "true"
```

## Troubleshooting

### Common Issues

1. **Domain verification fails**:
   - Check DNS records are correctly created
   - Wait up to 72 hours for propagation
   - Verify with `dig TXT _amazonses.yourdomain.com`

2. **SMTP authentication fails**:
   - Ensure you're using the derived SMTP password, not the IAM secret key
   - Check the region matches your SES setup
   - Verify IAM permissions

3. **Emails not sending**:
   - Check if you're in sandbox mode
   - Verify recipient email addresses are verified (sandbox mode)
   - Check SES sending quotas and limits

### Useful Commands

```bash
# Check domain verification status
aws ses get-identity-verification-attributes --identities yourdomain.com

# Check DKIM status
aws ses get-identity-dkim-attributes --identities yourdomain.com

# Check sending quotas
aws ses get-send-quota

# List verified identities
aws ses list-identities
```

## Cost Considerations

AWS SES pricing (as of 2024):
- First 62,000 emails/month: $0.10 per 1,000 emails
- Additional emails: $0.10 per 1,000 emails
- Data transfer: Standard AWS rates
- CloudWatch: Standard pricing for metrics and logs

Total monthly cost is typically under $5 for most use cases.

## Cleanup

To remove all AWS SES resources:

```bash
terraform destroy
```

Note: This will delete all SES configurations, verified domains, and SMTP users.