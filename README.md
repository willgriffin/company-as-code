# Enterprise GitOps Template

A production-ready GitHub template repository for deploying enterprise-grade Kubernetes infrastructure on [DigitalOcean](https://digitalocean.pxf.io/3evZdB) using GitOps principles with Flux v2 and advanced CDKTF orchestration.

## 🚀 Features

- **Enterprise GitOps workflow** with Flux v2 via Flux Operator for lifecycle management
- **Infrastructure as Code** using CDKTF (Terraform CDK) with TypeScript
- **Production-ready Kubernetes** on DigitalOcean with high availability
- **Advanced Ingress Controller** with NGINX Ingress and Ory Oathkeeper OIDC integration
- **GitOps-native secret management** using SOPS encryption with age keys
- **Event-driven email architecture** with CloudEvents and Knative for programmable email processing
- **Integrated enterprise applications**:
  - 🔐 **Keycloak** - Identity and Access Management with operator
  - 💬 **Mattermost** - Team collaboration with OIDC
  - ☁️ **Nextcloud** - Enterprise cloud storage with Spaces integration
  - 📧 **Disaggregated Mail Stack** - Postfix, Dovecot, Rspamd, SnappyMail with CloudEvents
- **Enterprise infrastructure**:
  - 🌐 NGINX Ingress Controller with TCP services and Ory Oathkeeper
  - 🔒 Automatic SSL/TLS with cert-manager
  - 🔑 SOPS with age encryption for GitOps-native secrets
  - 🌐 DNS management with External DNS
  - 🐘 High-availability PostgreSQL clusters with CloudNativePG
  - 🚀 Redis caching with Redis Operator
  - ⚡ Knative Serving and Eventing for serverless and event processing
  - 📧 CloudEvents-based email event processing with realm handlers
  - 📊 Comprehensive monitoring with Prometheus and Grafana
  - 💾 Automated backups with Velero

## 📋 Prerequisites

- **Node.js 22+** and **Bun** package manager
- **[DigitalOcean account](https://digitalocean.pxf.io/3evZdB)** with [API token](https://digitalocean.pxf.io/je2Ggv)
- **GitHub account** with personal access token (repo admin permissions)
- **Domain name** (will be configured with DigitalOcean DNS)
- **AWS account** for S3 Terraform state storage and SES email
- **CLI Tools** (installed by setup script if missing):
  - `aws` - AWS CLI
  - `gh` - GitHub CLI
  - `doctl` - DigitalOcean CLI
  - `sops` - Secrets encryption
  - `age-keygen` - Age key generation
  - `jq` - JSON processor

## 🛠️ Quick Start

### 1. Use This Template

Click the "Use this template" button on GitHub to create your own repository from this template.

### 2. Clone and Setup

```bash
# Clone your new repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Ensure you have Node.js 22+ and Bun installed
node --version  # Should be 22+
bun --version   # Install from: https://bun.sh

# Install dependencies and run the interactive setup script
bun install
npx tsx setup.ts
```

> **Note**: The setup script handles both configuration and authentication. It will guide you through all required steps.

### 3. Authentication Setup

Before running `setup.ts`, you need to provide API credentials as GitHub secrets:

```bash
# Required secrets (add these to your GitHub repository)
gh secret set DIGITALOCEAN_TOKEN --body "your-digitalocean-api-token"
gh secret set AWS_ACCESS_KEY_ID --body "your-aws-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-aws-secret-key"

# Optional (for GitHub CLI operations)
gh secret set GH_TOKEN --body "your-github-token"
```

Alternatively, set environment variables for local development:
```bash
export DIGITALOCEAN_TOKEN="your-digitalocean-api-token"
export AWS_ACCESS_KEY_ID="your-aws-access-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
```

### 4. Interactive Setup (Recommended)

The `setup.ts` script provides an interactive setup that will:

- **Create configuration**: Generate `platform/config.json` with your infrastructure settings (if missing)
- **Authenticate services**: Guide you through any missing authentication
- **Provision prerequisites**:
  - Create AWS S3 bucket for Terraform state (with versioning and encryption)
  - Set up DigitalOcean domain and Spaces
  - Generate SOPS age keys for secret encryption
- **Configure GitHub**: 
  - Set repository **secrets** for sensitive credentials only
  - Set repository **variables** for non-sensitive configuration
- **Setup project management**: Create workflow labels and optional project board

### 5. Environment Variable Setup (CI/CD)

For automated environments, provide configuration via environment variables:

```bash
# Set configuration environment variables (customize these values)
export SETUP_PROJECT_NAME="my-company"
export SETUP_DOMAIN="company.com"
export SETUP_EMAIL="devops@company.com"
export SETUP_DESCRIPTION="Production GitOps infrastructure"
export SETUP_REGION="nyc3"
export SETUP_NODE_SIZE="s-4vcpu-8gb"
export SETUP_NODE_COUNT="3"
export SETUP_ENVIRONMENT="production"

# Run setup with environment variables (non-interactive)
./setup.ts --yes --no-interactive
```

**Copy-Paste Example (replace with your values):**
```bash
# Quick setup - replace these values with your own
SETUP_PROJECT_NAME="acme-corp" \
SETUP_DOMAIN="acme.com" \
SETUP_EMAIL="devops@acme.com" \
SETUP_DESCRIPTION="ACME Corp production infrastructure" \
SETUP_REGION="nyc1" \
SETUP_NODE_SIZE="s-4vcpu-8gb" \
SETUP_NODE_COUNT="5" \
SETUP_ENVIRONMENT="production" \
./setup.ts --yes --no-interactive
```

### 6. Deploy Infrastructure

After setup completes, you'll have a `platform/config.json` file:

```json
{
  "project": {
    "name": "my-company",
    "domain": "company.com",
    "email": "devops@company.com",
    "description": "Production GitOps infrastructure"
  },
  "environments": [{
    "name": "production",
    "cluster": {
      "region": "nyc3",
      "nodeSize": "s-4vcpu-8gb",
      "nodeCount": 3,
      "haControlPlane": true
    },
    "domain": "company.com"
  }]
}
```

Deploy the infrastructure using GitHub Actions:

**Option 1 - GitHub UI**:
1. Go to Actions → "Deploy Infrastructure"
2. Click "Run workflow"
3. Select "apply" and run

**Option 2 - GitHub CLI**:
```bash
gh workflow run terraform-deploy.yml -f action=apply
```

**Option 3 - Local Deployment** (for development):
```bash
cd platform/base
bun install
bun run deploy
```

## 📁 Project Structure

```
.
├── .github/
│   ├── workflows/         # CI/CD pipelines with GitHub Actions
│   └── actions/          # Custom actions for tool setup and validation
├── manifests/            # GitOps manifests (formerly flux/)
│   ├── clusters/         # Cluster-specific configurations
│   ├── applications/     # Application deployments (Nextcloud, Mattermost, etc.)
│   ├── system/          # Infrastructure components (operators, ingress, etc.)
│   ├── flux-system/     # Flux configuration and reconciliation
│   ├── realms/          # Realm-specific Kubernetes manifests
│   └── shared/          # Shared configurations and templates
├── platform/            # CDKTF infrastructure (TypeScript)
│   ├── base/            # Core infrastructure stacks
│   ├── sync/            # Realm synchronization CDKTF application
│   ├── shared/          # Shared utilities and handler runtime
│   └── config.json      # Generated infrastructure configuration
├── realms/              # Realm configurations and event handlers
│   ├── example/         # Example realm template
│   └── [realm-name]/    # Your realm configurations
│       ├── realm.yaml   # Realm definition
│       ├── users/       # User definitions and overrides
│       └── events/      # Email event handlers (Python/TypeScript/JS)
├── sops/                # SOPS encrypted secrets
│   └── secrets/         # Encrypted secret files
├── templates/           # Configuration templates
│   └── realm/           # Realm template files
├── scripts/             # Automation and utility scripts
├── docs/               # Technical documentation
├── setup.ts            # Interactive setup script
├── .sops.yaml          # SOPS encryption configuration
└── tool-versions.txt   # Tool version specifications for CI/CD
```

## 🔧 Architecture

### Technology Stack

- **Infrastructure**: CDKTF (Terraform CDK) with TypeScript for type-safe infrastructure
- **Kubernetes**: DigitalOcean Kubernetes (DOKS) with high availability
- **GitOps**: Flux v2 managed by Flux Operator for declarative lifecycle management
- **Ingress Controller**: NGINX Ingress with TCP services, OIDC via Ory Oathkeeper
- **Certificates**: cert-manager with Let's Encrypt automation
- **DNS**: External DNS with DigitalOcean provider
- **Secrets**: SOPS encryption with age keys and Flux native decryption
- **Databases**: CloudNativePG operator for high-availability PostgreSQL clusters
- **Caching**: Redis Operator for distributed caching
- **Identity**: Keycloak with custom operator for enterprise SSO
- **Serverless**: Knative Serving for function deployment
- **Event Processing**: Knative Eventing with CloudEvents for email-driven workflows
- **Storage**: DigitalOcean Spaces as primary application storage
- **Monitoring**: Prometheus and Grafana with ServiceMonitors
- **Backups**: Velero for cluster-wide backup and disaster recovery

### CDKTF Stacks

The infrastructure uses a two-stage deployment approach:

**Stage 1 - Infrastructure**:
1. **DigitalOceanClusterStack** - Kubernetes cluster with node pools
2. **DigitalOceanSpacesStack** - Object storage for applications
3. **AWSSESStack** - Email infrastructure with SES
4. **FluxOperatorStack** - Installs Flux Operator via Helm

**Stage 2 - Kubernetes Resources**:
5. **ApplicationSecretsStack** - Generates application secrets in flux-system namespace
6. **SecretsBootstrapStack** - Bootstraps SOPS age key in cluster
7. **FluxInstanceStack** - Creates FluxInstance CRD for GitOps reconciliation
8. **GitHubSecretsStack** - Syncs configuration to GitHub repository secrets

### Deployment Flow

1. **Setup Script** creates prerequisites (S3 bucket, GitHub secrets/variables, SOPS keys)
2. **CDKTF Stage 1** provisions cloud infrastructure (cluster, storage, email, Flux Operator)
3. **CDKTF Stage 2** deploys Kubernetes resources (secrets, FluxInstance, GitHub sync)
4. **Flux Operator** manages Flux lifecycle via FluxInstance CRD
5. **Flux** syncs manifests from Git with automatic SOPS decryption
6. **System Components** deploy (operators, ingress, cert-manager, Knative)
7. **Applications** deploy with OIDC integration and encrypted secrets
8. **Realm Sync** synchronizes realm configurations to Keycloak and Knative
9. **Event Handlers** deploy as Knative services for email processing
10. **GitOps** continuously syncs all changes from the Git repository

## 🔐 Secret Management

This template uses **SOPS (Secrets Operations)** for GitOps-native secret management:

### SOPS Architecture

- **Encrypted Secrets in Git**: All secrets stored encrypted in `sops/secrets/*.enc.yaml`
- **Age Encryption**: Uses age keys for encryption/decryption
- **Flux Native Decryption**: Flux automatically decrypts secrets at runtime
- **Dual Key Storage**: Age private key in both GitHub Secrets and cluster
- **Automated Bootstrap**: Workflows generate and manage secrets automatically

### Configuration Architecture

- **Configuration in Git**: All non-sensitive configuration lives in `platform/config.json`
- **Infrastructure Secrets**: Encrypted with SOPS in `sops/secrets/infrastructure.enc.yaml`
- **Application Secrets**: Encrypted with SOPS in `sops/secrets/application.enc.yaml`
- **GitHub Secrets**: Only for age private key and cloud provider credentials

### GitHub Secrets vs Variables

**Repository Secrets** (sensitive credentials):
- `DIGITALOCEAN_TOKEN` - DigitalOcean API token
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `GH_TOKEN` - GitHub API token (optional)
- `SOPS_AGE_KEY` - Age private key for SOPS encryption/decryption (auto-generated)

**Repository Variables** (non-sensitive configuration):
- `PROJECT_NAME` - Project identifier (can override config.json)
- `DOMAIN` - Primary domain (can override config.json)
- `ADMIN_EMAIL` - Administrator email (can override config.json)
- `TERRAFORM_STATE_REGION` - AWS region for state storage (default: us-east-1)

### Secret Workflow

1. **First Deployment**: Workflow generates age key pair and creates SOPS files
2. **Encryption**: All secrets encrypted with age public key before Git storage
3. **Bootstrap**: Age private key stored in GitHub Secrets and cluster
4. **Runtime**: Flux decrypts secrets automatically using cluster age key
5. **Updates**: Edit SOPS files locally with `sops` command, commit encrypted changes

## 📚 Documentation

- [Architecture Details](docs/ARCHITECTURE.md) - Deep dive into system architecture
- [Deployment Guide](docs/DEPLOYMENT.md) - Complete deployment walkthrough
- [Application Setup](docs/APPLICATIONS.md) - Configuring applications with OIDC
- [Secret Management](docs/SECRETS.md) - SOPS usage and troubleshooting
- [SOPS Migration](docs/SOPS_MIGRATION.md) - Migration to SOPS-based secrets
- [Configuration](docs/CONFIGURATION.md) - TypeScript configuration options
- [Workflow](WORKFLOW.md) - Development workflow and issue management
- [Kanban Workflow](KANBAN.md) - Issue tracking and project management

## 🚀 Advanced Features

### Event-Driven Email Architecture

This template includes a sophisticated event-driven email processing system:

- **CloudEvents Integration**: Dovecot emits CloudEvents on email receipt
- **Knative Eventing**: Event routing via Knative broker and triggers
- **Realm Event Handlers**: Python/TypeScript/JavaScript functions in `realms/[realm]/events/`
- **User Event Handlers**: Per-user overrides in `realms/[realm]/users/[user]/events/`
- **Universal Runtime**: Container supporting multiple languages with Sentry integration
- **Automatic Deployment**: GitHub Actions deploys handlers as Knative services

### NGINX Ingress & Ory Oathkeeper Integration

Enterprise-grade networking and authentication:

- **NGINX Ingress Controller**: Kubernetes-native ingress with TCP service support
- **Ory Oathkeeper**: Identity & Access Proxy (IAP) for authentication and authorization
- **OIDC Authentication**: Integrated with Keycloak for single sign-on
- **TCP Services**: Support for email protocols (SMTP, IMAP, POP3, Submission)
- **SSL/TLS Termination**: Automatic certificate management
- **Monitoring**: Comprehensive metrics and observability

### High-Availability PostgreSQL

Applications use CloudNativePG for enterprise database features:

- **Cluster Mode**: 3-replica clusters for high availability
- **Automatic Failover**: Built-in leader election and failover
- **Backup Integration**: Automated backups to object storage
- **Performance Monitoring**: Advanced metrics and alerting

### Realm Management System

Multi-tenant realm configuration with automated synchronization:

- **Realm Definitions**: YAML-based realm configuration in `realms/[realm]/realm.yaml`
- **User Management**: User definitions and email routing rules
- **Event Handlers**: Custom email processing logic per realm/user
- **CDKTF Sync**: Automatic synchronization to Keycloak and Knative
- **GitHub Workflow**: Automated deployment on realm changes

### Application Features

- **Nextcloud**: Enterprise cloud storage with DigitalOcean Spaces as primary storage
- **Mattermost**: Full OIDC integration with Keycloak for SSO
- **Keycloak**: Deployed via operator with automated realm configuration
- **Mail Stack**: Disaggregated Postfix, Dovecot, Rspamd, SnappyMail with CloudEvents

## 🤝 Contributing

This is an enterprise-grade template requiring:

- **Node.js 22+** and **Bun** for development
- **TypeScript** knowledge for CDKTF stack development
- **Kubernetes** experience for manifest customization
- **GitOps** understanding for Flux and SOPS workflows

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Powered by [DigitalOcean Kubernetes](https://digitalocean.pxf.io/3evZdB)
- GitOps by [Flux](https://fluxcd.io/)
- Infrastructure by [CDKTF](https://developer.hashicorp.com/terraform/cdktf)
- Ingress Controller by [NGINX](https://www.nginx.com/)
- Identity & Access Proxy by [Ory Oathkeeper](https://www.ory.sh/oathkeeper/)
- Secrets by [SOPS](https://github.com/getsops/sops) and [age](https://github.com/FiloSottile/age)
- Serverless by [Knative](https://knative.dev/)
- Event Processing by [CloudEvents](https://cloudevents.io/)

---

**Note**: Links to DigitalOcean are affiliate links that support the maintenance of this template.