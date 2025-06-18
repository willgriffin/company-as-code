# Deployment Guide

This comprehensive guide walks through the complete deployment process for the enterprise GitOps template, from initial setup to production deployment.

## Prerequisites

Before starting deployment, ensure you have the following:

### Required Software
- **Node.js 22+** - Required for CDKTF and setup scripts
- **PNPM** - Package manager for monorepo workspace
- **Git** - Version control and repository access

```bash
# Verify versions
node --version    # Should be 22.0.0 or higher
pnpm --version    # Install with: npm install -g pnpm
git --version     # Any recent version
```

### Required Accounts
- **[DigitalOcean Account](https://digitalocean.pxf.io/3evZdB)** with [API token](https://digitalocean.pxf.io/je2Ggv)
- **GitHub Account** with personal access token (repo and workflow permissions)
- **AWS Account** for S3 Terraform state storage and SES email
- **Domain Name** registered and configured with DigitalOcean DNS

### Required Permissions
- **DigitalOcean**: Full access to Kubernetes, Spaces, DNS, and Load Balancers
- **AWS**: S3 full access, SES send email, IAM user creation
- **GitHub**: Repository admin access for secrets and workflow management

## Deployment Process

### Phase 1: Repository Setup

#### 1. Create Repository from Template

1. Navigate to the template repository on GitHub
2. Click **"Use this template"** button
3. Choose repository name and visibility settings
4. Clone your new repository:

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

#### 2. Install Dependencies

```bash
# Install dependencies for setup script
pnpm install

# Install platform dependencies
cd platform
pnpm install
cd ..
```

### Phase 2: Interactive Setup

#### 1. Run Setup Script

The `setup.ts` script handles all prerequisite setup:

```bash
./setup.ts
```

#### 2. Setup Script Workflow

The interactive setup process includes:

##### **Configuration Generation**
- Project name and description
- Primary domain configuration
- Admin email for SSL certificates
- Environment settings (staging/production)
- Cluster specifications (region, node size, count)

##### **Service Authentication**
The script will guide you through authenticating with required services:

**DigitalOcean**:
```bash
# You'll be prompted to enter your DigitalOcean API token
# Get token from: https://cloud.digitalocean.com/account/api/tokens
Enter DigitalOcean API token: do_xxxxxxxxxxxxxxxx
```

**AWS**:
```bash
# AWS credentials for S3 and SES
Enter AWS Access Key ID: AKIAXXXXXXXXXXXXXXXX
Enter AWS Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Enter AWS Region [us-east-1]: us-east-1
```

**GitHub**:
```bash
# GitHub personal access token with repo and workflow permissions
Enter GitHub Personal Access Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

##### **Infrastructure Prerequisites**
The setup script automatically creates:

1. **AWS S3 Bucket for Terraform State**:
   - Bucket with versioning enabled
   - Server-side encryption with AES-256
   - Public access blocked
   - Lifecycle policies for cost optimization

2. **DigitalOcean Spaces Bucket**:
   - Spaces bucket for application storage
   - CDN endpoint configuration
   - CORS settings for web applications
   - Access keys for application integration

3. **AWS SES Configuration**:
   - Domain identity verification
   - SMTP credentials generation
   - DKIM signing configuration
   - Bounce and complaint handling

4. **GitHub Repository Secrets**:
   - All required secrets automatically added
   - Workflow permissions configured
   - Labels and project board creation (optional)

#### 3. Generated Configuration

After setup completion, you'll have a `platform/config.json` file:

```json
{
  "project": {
    "name": "my-company",
    "domain": "company.com",
    "email": "devops@company.com",
    "description": "Production GitOps infrastructure"
  },
  "environments": [
    {
      "name": "production",
      "cluster": {
        "region": "nyc3",
        "nodeSize": "s-4vcpu-8gb",
        "nodeCount": 3,
        "minNodes": 2,
        "maxNodes": 10,
        "haControlPlane": true,
        "version": "1.31.0"
      },
      "domain": "company.com"
    }
  ]
}
```

### Phase 3: Infrastructure Deployment

#### 1. CDKTF Deployment

Navigate to the platform directory and deploy infrastructure:

```bash
cd platform

# Install dependencies (if not done already)
pnpm install

# Initialize CDKTF (first time only)
npx cdktf get

# Plan deployment (optional, to review changes)
npx cdktf plan

# Deploy infrastructure
npx cdktf deploy
```

#### 2. Deployment Process

The CDKTF deployment creates infrastructure in this order:

1. **DigitalOcean Spaces Stack** - Object storage for applications
2. **AWS SES Stack** - Email infrastructure
3. **DigitalOcean Cluster Stack** - Kubernetes cluster
4. **Flux Configuration Stack** - GitOps bootstrap
5. **GitHub Secrets Stack** - Automated secret management

#### 3. Deployment Monitoring

Monitor deployment progress:

```bash
# Watch CDKTF deployment
npx cdktf deploy --auto-approve

# Monitor cluster creation (separate terminal)
watch doctl kubernetes cluster list

# Check cluster status once created
kubectl get nodes
kubectl get pods --all-namespaces
```

### Phase 4: GitOps Bootstrap

#### 1. Flux Installation

After cluster creation, Flux is automatically bootstrapped:

```bash
# Verify Flux installation
kubectl get pods -n flux-system

# Check GitOps sync status
flux get sources git
flux get kustomizations
```

#### 2. External Secrets Operator

Verify External Secrets Operator deployment:

```bash
# Check ESO pods
kubectl get pods -n external-secrets

# Verify secret stores
kubectl get secretstores --all-namespaces

# Check external secrets
kubectl get externalsecrets --all-namespaces
```

#### 3. Kong Gateway

Verify Kong Gateway installation:

```bash
# Check Kong pods
kubectl get pods -n kong

# Verify Gateway API resources
kubectl get gateways --all-namespaces
kubectl get httproutes --all-namespaces
```

### Phase 5: Application Deployment

#### 1. Core Infrastructure

Core infrastructure components deploy automatically via GitOps:

- **cert-manager** - TLS certificate management
- **external-dns** - DNS record automation
- **external-secrets** - Secret injection
- **database-operators** - PostgreSQL and Redis operators

#### 2. Applications

Applications deploy based on configuration:

- **Keycloak** - Identity and access management
- **Nextcloud** - Cloud storage platform
- **Mattermost** - Team collaboration
- **Mailu/Postal** - Email servers

#### 3. Monitoring Applications

Monitor application deployment:

```bash
# Check application namespaces
kubectl get namespaces

# Monitor application pods
watch kubectl get pods --all-namespaces

# Check application services
kubectl get services --all-namespaces

# Verify ingress/gateway routes
kubectl get httproutes --all-namespaces
```

## Deployment Verification

### 1. Cluster Health

Verify cluster components:

```bash
# Node status
kubectl get nodes -o wide

# System pods
kubectl get pods -n kube-system

# Storage classes
kubectl get storageclass

# Persistent volumes
kubectl get pv,pvc --all-namespaces
```

### 2. GitOps Status

Check GitOps synchronization:

```bash
# Flux status
flux get all

# Git repository sync
flux get sources git

# Kustomization status
flux get kustomizations

# Check for any failed reconciliations
flux events --all-namespaces
```

### 3. Application Access

Test application accessibility:

```bash
# Get LoadBalancer IP
kubectl get services -n kong kong-gateway

# Check DNS resolution
dig company.com
dig nextcloud.company.com
dig mattermost.company.com

# Test HTTPS certificates
curl -I https://nextcloud.company.com
```

### 4. Secret Management

Verify secret injection:

```bash
# Check external secret status
kubectl get externalsecrets --all-namespaces

# Verify created secrets
kubectl get secrets --all-namespaces | grep -v default-token

# Check secret store connectivity
kubectl describe secretstore github-secret-store -n external-secrets
```

## Environment Variables for CI/CD

For automated deployments, use environment variables:

### Required Environment Variables

```bash
# Core configuration
export SETUP_PROJECT_NAME="my-company"
export SETUP_DOMAIN="company.com"
export SETUP_EMAIL="devops@company.com"
export SETUP_DESCRIPTION="Production infrastructure"

# Cluster configuration
export SETUP_REGION="nyc3"
export SETUP_NODE_SIZE="s-4vcpu-8gb"
export SETUP_NODE_COUNT="3"
export SETUP_ENVIRONMENT="production"

# Service credentials
export DIGITALOCEAN_TOKEN="do_xxxxxxxxxxxxxxxx"
export AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
export AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Automated Deployment

Run automated deployment:

```bash
# Set all environment variables first, then:
./setup.ts --yes --no-interactive

# Deploy infrastructure
cd platform
npx cdktf deploy --auto-approve
```

## Troubleshooting

### Common Issues

#### 1. Setup Script Failures

**Invalid credentials**:
```bash
# Verify DigitalOcean token
doctl auth init --access-token $DIGITALOCEAN_TOKEN
doctl account get

# Verify AWS credentials
aws sts get-caller-identity

# Verify GitHub token
gh auth status
```

**Missing permissions**:
- Ensure GitHub token has `repo` and `workflow` scopes
- Verify AWS IAM user has S3 and SES permissions
- Check DigitalOcean token has full access

#### 2. CDKTF Deployment Issues

**State conflicts**:
```bash
# Check Terraform state
cd platform
npx cdktf plan

# Force refresh state
npx cdktf refresh
```

**Resource conflicts**:
- Ensure resource names are unique
- Check for existing DigitalOcean resources
- Verify AWS S3 bucket names are globally unique

#### 3. Cluster Issues

**Nodes not ready**:
```bash
# Check node status
kubectl describe nodes

# Check cluster events
kubectl get events --sort-by=.metadata.creationTimestamp
```

**Pod failures**:
```bash
# Check pod logs
kubectl logs -n flux-system -l app=source-controller

# Check resource constraints
kubectl top nodes
kubectl top pods --all-namespaces
```

#### 4. GitOps Issues

**Flux not syncing**:
```bash
# Force reconciliation
flux reconcile source git flux-system

# Check Git access
flux logs --all-namespaces

# Verify GitHub token in cluster
kubectl get secrets -n flux-system
```

**External secrets not working**:
```bash
# Check ESO controller logs
kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets

# Verify secret store configuration
kubectl describe secretstore github-secret-store -n external-secrets
```

### Getting Help

If you encounter issues:

1. **Check logs**: Use `kubectl logs` to examine pod logs
2. **Events**: Use `kubectl get events` to see cluster events
3. **Status**: Use `kubectl describe` to check resource status
4. **Documentation**: Refer to component-specific documentation
5. **Community**: Seek help in project GitHub issues

## Post-Deployment

### 1. DNS Configuration

Configure your domain DNS:

```bash
# Get LoadBalancer IP
kubectl get services -n kong kong-gateway

# Create DNS A records pointing to LoadBalancer IP:
# company.com -> LoadBalancer IP
# *.company.com -> LoadBalancer IP
```

### 2. Application Setup

Complete application-specific setup:

1. **Keycloak**: Access admin console and configure realms
2. **Nextcloud**: Complete initial setup wizard
3. **Mattermost**: Create first team and admin user
4. **Email**: Configure email domains and users

### 3. Monitoring Setup

Configure monitoring and alerting:

```bash
# Access Grafana dashboard
kubectl port-forward -n monitoring service/grafana 3000:80

# Configure alert destinations
# Set up notification channels
# Create custom dashboards
```

### 4. Backup Verification

Verify backup systems:

```bash
# Check Velero backups
kubectl get backups -n velero

# Verify database backups
kubectl get clusters.postgresql.cnpg.io --all-namespaces

# Test backup restoration procedures
```

This deployment guide ensures a successful enterprise GitOps deployment with proper monitoring, security, and operational practices.