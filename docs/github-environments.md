# GitHub Environments Setup

This document explains how to set up GitHub environments for deployment approvals in your GitOps template repository.

## Overview

GitHub environments provide deployment protection and approval workflows. This template uses a `production` environment to ensure all infrastructure deployments require manual approval.

## Setup Process

The `setup-repo.sh` script automatically creates the production environment. However, some configuration requires manual steps through the GitHub web interface.

### Automatic Setup (via setup-repo.sh)

The setup script will:
- Create the `production` environment
- Display instructions for manual configuration

### Manual Configuration Required

After running setup-repo.sh, complete the configuration:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments** → **production**

### Configure Protection Rules

In the production environment configuration:

1. **Required reviewers**: Add yourself or team members who should approve deployments
2. **Deployment branches**: Restrict to `main` branch only
3. **Environment secrets**: Move production secrets here (see next section)

### Environment Secrets (Optional)

Move these secrets from repository level to the `production` environment:

- `DIGITALOCEAN_TOKEN`
- `DIGITALOCEAN_SPACES_ACCESS_KEY`
- `DIGITALOCEAN_SPACES_SECRET_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SES_SMTP_USERNAME` (if using email notifications)
- `AWS_SES_SMTP_PASSWORD` (if using email notifications)
- `KUBECONFIG` (automatically updated by workflows)

Keep these at repository level:
- `GITHUB_TOKEN` (automatically provided)

## Workflow Integration

The following workflows now use the `production` environment:

- **terraform-deploy.yml**: Infrastructure deployment jobs
- **flux-bootstrap.yml**: GitOps bootstrap job

## Benefits

✅ **Approval Required**: All production deployments require manual approval
✅ **Branch Protection**: Only main branch can deploy to production  
✅ **Audit Trail**: Complete deployment history and approvals
✅ **Environment Isolation**: Production secrets separated from repository secrets
✅ **Native Notifications**: GitHub's built-in notification system

## Usage

1. **Automatic Triggers**: Push to main branch triggers infrastructure deployment
2. **Manual Triggers**: Use workflow_dispatch for manual deployments
3. **Approval Process**: Designated reviewers receive notifications and can approve/reject
4. **Status Tracking**: Monitor deployment status in Actions tab and environment page

## Cost Considerations

This setup uses GitHub's native approval system without additional infrastructure costs. No staging clusters are created - approval gates control when production deployments occur.