# GitHub Template Setup Guide

This repository is designed to be used as a GitHub template for quickly deploying a complete Kubernetes infrastructure with GitOps using Flux on [DigitalOcean](https://digitalocean.pxf.io/3evZdB).

> **Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.

## Quick Start

### 1. Create Repository from Template

1. Click "Use this template" on the GitHub repository page
2. Create a new repository in your GitHub account/organization
3. Clone your new repository locally

### 2. Set Up Required Secrets

Before deploying, you need to set up the required secret and configure permissions:

#### Required Secret

Go to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

- **`DIGITALOCEAN_TOKEN`**: Your DigitalOcean API token with read/write access

#### Creating DigitalOcean Token

1. Go to [https://cloud.digitalocean.com/account/api/tokens](https://digitalocean.pxf.io/je2Ggv)
2. Click "Generate New Token"
3. Name it (e.g., "Kubernetes Template")
4. Select "Read" and "Write" scopes
5. Copy the token and add it as `DIGITALOCEAN_TOKEN` secret

#### GitHub Token (Usually Not Required)

The template uses GitHub's built-in `GITHUB_TOKEN`, which is automatically provided to workflows. However, if you encounter permission issues, you may need to:

1. **Check repository permissions**: Go to **Settings → Actions → General → Workflow permissions**
2. **Select**: "Read and write permissions" 
3. **Enable**: "Allow GitHub Actions to create and approve pull requests"

**Only if the above doesn't work**, create a custom token:
1. Go to [GitHub Personal Access Tokens](https://github.com/settings/personal-access-tokens/new)
2. Grant: Contents (Read/Write), Metadata (Read), Secrets (Write), Actions (Read)
3. Add as `GITHUB_TOKEN` secret (this will override the default token)

### 3. Configure Repository Settings

Copy the configuration template and customize it:

```bash
cp config.yaml.example config.yaml
```

Edit `config.yaml` with your settings:

```yaml
# Repository Information
repository:
  owner: "your-github-username"  # Your GitHub username or organization
  name: "your-repo-name"         # Your repository name

# Domain Configuration  
domain:
  primary: "yourdomain.com"      # Your primary domain
  
# Other settings...
```

**Important**: Make sure you have set up your domain in DigitalOcean DNS before deploying.

### 4. Deploy the Cluster

Once you've configured `config.yaml` and set up the GitHub secrets, commit and push your changes:

```bash
git add config.yaml
git commit -m "feat: configure repository for deployment"
git push
```

The GitHub Actions workflow will automatically:
1. Validate your configuration
2. Generate encryption keys and application secrets
3. Deploy the Kubernetes cluster using Terraform
4. Bootstrap Flux GitOps
5. Deploy all applications

You can also manually trigger deployment by going to **Actions → Deploy Kubernetes Cluster → Run workflow**.

## What Gets Deployed

### Infrastructure
- [DigitalOcean](https://digitalocean.pxf.io/3evZdB) Kubernetes cluster
- Terraform state stored in DigitalOcean Spaces
- Flux GitOps system for continuous deployment

### Core Services
- **Traefik**: Ingress controller and load balancer
- **cert-manager**: Automatic TLS certificate management
- **external-dns**: Automatic DNS record management

### Applications (all optional, configurable in `config.yaml`)
- **Keycloak**: Identity and access management (`auth.yourdomain.com`)
- **Mattermost**: Team chat and collaboration (`chat.yourdomain.com`)
- **Nextcloud**: Cloud storage and office suite (`cloud.yourdomain.com`)
- **Mailu**: Email server (`mail.yourdomain.com`)

## Configuration Options

### Domain Configuration
```yaml
domain:
  primary: "yourdomain.com"     # Required: Your main domain
  subdomain_prefix: "k8s"       # Optional: Prefix for service subdomains
```

### Cluster Configuration
```yaml
cluster:
  name: "cumulus"              # Cluster name
  region: "nyc3"               # DigitalOcean region
  node_size: "s-1vcpu-2gb"     # Node size
  min_nodes: 2                 # Minimum nodes
  max_nodes: 3                 # Maximum nodes
  node_count: 2                # Initial node count
  auto_scale: true             # Enable autoscaling
```

### Service Configuration
```yaml
services:
  keycloak:
    enabled: true              # Enable/disable Keycloak
    admin_user: "admin"        # Admin username
    realm_name: "myrealm"      # Keycloak realm name
  
  mattermost:
    enabled: true              # Enable/disable Mattermost
    site_name: "My Team Chat"  # Site display name
  
  # Similar configuration for nextcloud and mailu...
```

## DNS Setup

**Important**: Before deploying, you must set up your domain in DigitalOcean DNS:

1. Go to [DigitalOcean Networking → Domains](https://digitalocean.pxf.io/3evZdB)
2. Click "Add Domain"
3. Enter your domain name
4. Point your domain's nameservers to DigitalOcean:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

The template will automatically create DNS records for your services using external-dns.

## Monitoring Deployment

### GitHub Actions
Monitor the deployment progress in the **Actions** tab of your repository. The workflow includes these steps:

1. **Validate Configuration**: Checks your config.yaml and secrets
2. **Generate and Setup Secrets**: Creates encryption keys and application passwords
3. **Deploy Infrastructure**: Creates the Kubernetes cluster
4. **Generate Encrypted Secrets**: Creates encrypted secrets for applications
5. **Wait for Flux Reconciliation**: Waits for GitOps to deploy applications

### Kubectl Access
After deployment, you can access your cluster using kubectl:

```bash
# The kubeconfig is automatically stored as a GitHub secret
# Download it from Actions → Secrets if you need local access
```

### Flux Monitoring
Monitor GitOps deployment:

```bash
# Check Flux status
kubectl get gitrepository,kustomizations -n flux-system

# Check application pods
kubectl get pods -A

# View Flux logs
kubectl logs -n flux-system deployment/kustomize-controller
```

## Troubleshooting

### Common Issues

1. **Configuration Validation Failed**
   - Check that you've updated all placeholder values in `config.yaml`
   - Ensure domain format is correct
   - Verify node configuration values

2. **Missing GitHub Secrets**
   - Make sure both `DIGITALOCEAN_TOKEN` and `GITHUB_TOKEN` are set
   - Verify token permissions are correct

3. **Domain DNS Issues**
   - Ensure your domain is set up in DigitalOcean DNS
   - Check nameserver configuration
   - Wait for DNS propagation (can take up to 48 hours)

4. **Deployment Timeout**
   - Large applications may take 10-15 minutes to fully deploy
   - Check individual pod status: `kubectl get pods -A`
   - Review Flux logs for specific errors

### Manual Commands

If you need to troubleshoot or manually manage the cluster:

```bash
# Check cluster status
kubectl get nodes

# Check all pods
kubectl get pods -A

# Check ingress status
kubectl get ingress -A

# Check certificates
kubectl get certificates -A

# Force Flux reconciliation
flux reconcile kustomization flux-system -n flux-system

# Check external-dns logs
kubectl logs -n external-dns deployment/external-dns
```

## Cleanup

To destroy the entire infrastructure:

1. Go to **Actions → Deploy Kubernetes Cluster**
2. Click "Run workflow"
3. Check "Destroy cluster instead of creating it"
4. Click "Run workflow"

This will:
- Remove all Kubernetes resources
- Delete the DigitalOcean cluster
- Clean up DNS records
- Preserve your repository and configuration

## Security Notes

- All secrets are encrypted using SOPS with age encryption
- Private keys are stored securely in GitHub Secrets
- Application passwords are automatically generated
- TLS certificates are automatically managed by cert-manager
- DNS records are automatically managed by external-dns

## Support

For issues with this template:
1. Check the troubleshooting section above
2. Review GitHub Actions logs for specific errors
3. Check Kubernetes pod logs for application issues
4. Open an issue in the template repository