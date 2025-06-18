# Startup GitOps Template

A comprehensive GitHub template repository for deploying production-ready Kubernetes infrastructure on [DigitalOcean](https://digitalocean.pxf.io/3evZdB) using GitOps principles with Flux v2.

## 🚀 Features

- **One-click deployment** using GitHub's template repository feature
- **GitOps workflow** with Flux v2 for continuous deployment
- **Infrastructure as Code** using Terraform (with CDKTF support)
- **Production-ready Kubernetes** on DigitalOcean
- **Integrated applications** (optional):
  - 🔐 **Keycloak** - Identity and Access Management
  - 💬 **Mattermost** - Team collaboration
  - ☁️ **Nextcloud** - File storage and productivity
  - 📧 **Mailu** - Full-featured email server
- **Enterprise features**:
  - 🔒 Automatic SSL/TLS with cert-manager
  - 🔑 External Secrets Operator for secret management
  - 🌐 DNS management with External DNS
  - 🛡️ OAuth2 proxy integration
  - 🐘 PostgreSQL clusters with CloudNativePG
  - 🚀 Redis caching with Redis Operator

## 📋 Prerequisites

- **[DigitalOcean account](https://digitalocean.pxf.io/3evZdB)** with [API token](https://digitalocean.pxf.io/je2Ggv)
- **GitHub account** with personal access token
- **Domain name** configured with DigitalOcean DNS
- **AWS account** (optional, for email with SES)

## 🛠️ Quick Start

### Option A: Automated Setup (Recommended)

#### 1. Use This Template

Click the "Use this template" button on GitHub to create your own repository from this template.

#### 2. Clone and Run Setup

```bash
# Clone your new repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Run the interactive setup script
./setup.ts
```

**Option 2A: Interactive Setup (Default)**
The setup script will interactively prompt for configuration and then:
- Create `platform/config.json` with your infrastructure settings
- Guide you through authentication for DigitalOcean, AWS, and GitHub
- Create DigitalOcean Spaces bucket for Terraform state
- Set up AWS SES credentials for email functionality
- Configure GitHub repository secrets automatically
- Create workflow labels and optional project board

**Option 2B: Environment Variable Setup (CI/CD)**
For automated environments, provide configuration via environment variables:

```bash
# Set configuration environment variables (customize these values)
export SETUP_PROJECT_NAME="my-startup"
export SETUP_DOMAIN="example.com"
export SETUP_EMAIL="admin@example.com"
export SETUP_DESCRIPTION="GitOps infrastructure for my startup"
export SETUP_REGION="nyc3"
export SETUP_NODE_SIZE="s-2vcpu-4gb"
export SETUP_NODE_COUNT="3"
export SETUP_ENVIRONMENT="production"

# Run setup with environment variables (non-interactive)
./setup.ts --yes --no-interactive
```

**Copy-Paste Example (replace with your values):**
```bash
# Quick setup - replace these values with your own and run as one command
SETUP_PROJECT_NAME="acme-corp" \
SETUP_DOMAIN="acme.com" \
SETUP_EMAIL="devops@acme.com" \
SETUP_DESCRIPTION="ACME Corp production infrastructure" \
SETUP_REGION="nyc1" \
SETUP_NODE_SIZE="s-4vcpu-8gb" \
SETUP_NODE_COUNT="5" \
SETUP_ENVIRONMENT="production" \
./setup.ts --yes --no-interactive && \
cd platform && \
npm install && \
npx cdktf deploy
```

**Available Environment Variables:**
- `SETUP_PROJECT_NAME` - Project name (overrides `PROJECT_NAME`)
- `SETUP_DOMAIN` - Primary domain (overrides `DOMAIN`)
- `SETUP_EMAIL` - Admin email for SSL certificates (overrides `EMAIL`)
- `SETUP_DESCRIPTION` - Project description
- `SETUP_REGION` - DigitalOcean region (overrides `DO_REGION`)
- `SETUP_NODE_SIZE` - Kubernetes node size (overrides `NODE_SIZE`)
- `SETUP_NODE_COUNT` - Number of nodes (overrides `NODE_COUNT`)
- `SETUP_ENVIRONMENT` - Environment name (overrides `ENVIRONMENT`)

#### 3. Deploy Infrastructure

After setup completes, you'll have a `platform/config.json` file with your infrastructure settings:

```json
{
  "project": {
    "name": "my-startup",
    "domain": "example.com",
    "email": "admin@example.com",
    "description": "GitOps infrastructure for my startup"
  },
  "environments": [{
    "name": "production",
    "cluster": {
      "region": "nyc3",
      "nodeSize": "s-2vcpu-4gb",
      "nodeCount": 3,
      "haControlPlane": true
    },
    "domain": "example.com"
  }]
}
```

Deploy the infrastructure:
```bash
# Deploy using CDKTF
cd platform
npm install
npx cdktf deploy
```

### Option B: Manual Setup

#### 1. Use This Template

Click the "Use this template" button on GitHub to create your own repository from this template.

#### 2. Configure Repository Secrets

Manually add these secrets to your GitHub repository:

```
DIGITALOCEAN_TOKEN       # Your DigitalOcean API token
SPACES_ACCESS_KEY_ID     # DigitalOcean Spaces access key
SPACES_SECRET_ACCESS_KEY # DigitalOcean Spaces secret key
SPACES_BUCKET_NAME       # Bucket name for Terraform state
DOMAIN                   # Your domain (e.g., example.com)
ADMIN_EMAIL             # Admin email address
AWS_ACCESS_KEY_ID       # AWS IAM access key (optional, for SES)
AWS_SECRET_ACCESS_KEY   # AWS IAM secret key (optional, for SES)
AWS_SES_SMTP_USERNAME   # SES SMTP username (optional)
AWS_SES_SMTP_PASSWORD   # SES SMTP password (optional)
```

#### 3. Configure Your Deployment

1. Create your configuration file:
   ```bash
   cp config.json.example config.json
   ```

2. Edit `config.json` with your settings:
   ```json
   {
     "project": {
       "name": "my-startup",
       "domain": "example.com",
       "email": "admin@example.com"
     },
     "environments": [{
       "name": "production",
       "cluster": {
         "region": "nyc3",
         "nodeSize": "s-2vcpu-4gb",
         "nodeCount": 3
       },
       "domain": "example.com"
     }],
     "applications": ["keycloak", "mattermost"]
   }
   ```

#### 4. Deploy Infrastructure

Run the CDKTF deployment:
```bash
cd platform
npm install
npx cdktf deploy
```

### Setup Script Options

```bash
./setup.sh [OPTIONS]

OPTIONS:
  --config PATH        Configuration file path (default: config.json)
  --dry-run           Preview actions without executing
  --skip-github       Skip GitHub secrets and project setup
  --skip-project      Skip GitHub project board setup only
  --no-interactive    Fail if credentials missing (CI mode)
  --yes               Auto-approve confirmation prompts
  --verbose           Show detailed command output
  --eject             Remove template artifacts (after setup)
  --help              Show help message

EXAMPLES:
  ./setup.sh                     # Interactive setup with prompts
  ./setup.sh --dry-run           # Preview what would be done
  ./setup.sh --yes               # Auto-approve all prompts
  ./setup.sh --eject             # Remove template files
```

## 📁 Project Structure

```
.
├── .github/
│   ├── workflows/         # CI/CD pipelines
│   └── actions/          # Custom GitHub Actions
├── flux/
│   ├── clusters/         # Cluster-specific configurations
│   │   └── production/   # Production cluster manifests
│   └── infrastructure/   # Core infrastructure components
├── terraform/            # Infrastructure as Code
│   ├── modules/         # Reusable Terraform modules
│   └── environments/    # Environment-specific configs
├── platform/            # CDKTF infrastructure (TypeScript)
│   ├── src/
│   │   ├── stacks/     # Terraform CDK stacks
│   │   └── main.ts     # CDKTF entry point
│   └── cdktf.json      # CDKTF configuration
├── scripts/             # Automation scripts
│   ├── setup.sh        # Initial setup
│   ├── deploy.sh       # Deployment automation
│   └── destroy.sh      # Teardown script
├── docs/               # Documentation
└── config.yaml         # Main configuration file
```

## 🔧 Configuration

### Main Configuration (`config.yaml`)

```yaml
# Basic Settings
domain: example.com
email: admin@example.com
cluster_name: production-cluster
region: nyc3

# Cluster Configuration
node_size: s-2vcpu-4gb
node_count: 3
min_nodes: 2
max_nodes: 5

# Applications (optional)
applications:
  - keycloak      # Identity management
  - mattermost    # Team chat
  - nextcloud     # File storage
  - mailu         # Email server

# Features
features:
  monitoring: true    # Prometheus & Grafana
  backup: true       # Velero backups
  ssl: true          # Let's Encrypt
```

### Secret Management

Secrets are managed using External Secrets Operator (ESO) with GitHub as the secret store:

1. **GitHub Repository Secrets** store sensitive values
2. **External Secrets Operator** syncs secrets from GitHub to Kubernetes
3. **SecretStore** resources define the connection to GitHub
4. **ExternalSecret** resources specify which secrets to sync

Example ExternalSecret:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: github-secret-store
  target:
    name: app-secrets
  data:
    - secretKey: database-password
      remoteRef:
        key: DATABASE_PASSWORD
```

## 🏗️ Architecture

### Technology Stack

- **Kubernetes**: DigitalOcean Kubernetes (DOKS)
- **GitOps**: Flux v2 for continuous deployment
- **Infrastructure**: Terraform with optional CDKTF
- **Ingress**: Traefik proxy
- **Certificates**: cert-manager with Let's Encrypt
- **DNS**: External DNS with DigitalOcean
- **Secrets**: External Secrets Operator with GitHub backend
- **Databases**: CloudNativePG operator
- **Caching**: Redis operator
- **Identity**: Keycloak with custom operator

### Deployment Flow

1. **GitHub Actions** triggers on push to main
2. **Terraform** provisions infrastructure
3. **Flux** is bootstrapped to the cluster
4. **External Secrets Operator** is deployed
5. **Flux** syncs manifests from Git repository
6. **ESO** syncs secrets from GitHub to Kubernetes
7. **Applications** are deployed with secrets available

## 📚 Documentation

- [Secret Management](docs/SECRETS.md) - Using External Secrets Operator
- [Application Setup](docs/APPLICATIONS.md) - Configuring applications
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Workflow](WORKFLOW.md) - Development workflow and issue management

## 🔐 Security

- Secrets stored in GitHub repository secrets
- External Secrets Operator syncs secrets securely
- TLS certificates auto-provisioned via Let's Encrypt
- Network policies for pod isolation
- RBAC configured for least privilege
- Regular security updates via Flux

## 🚀 Advanced Usage

### Using CDKTF

To use TypeScript-based infrastructure:

```bash
cd platform
npm install
npm run deploy
```

### Custom Applications

Add custom applications by creating Flux Kustomizations:

```yaml
# flux/clusters/production/apps/my-app.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  path: ./apps/my-app
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
```

### Adding External Secrets

Create an ExternalSecret to sync from GitHub:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-app-secrets
  namespace: my-app
spec:
  secretStoreRef:
    name: github-secret-store
    kind: SecretStore
  target:
    name: my-app-secrets
  data:
    - secretKey: api-key
      remoteRef:
        key: MY_APP_API_KEY
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Powered by [DigitalOcean Kubernetes](https://digitalocean.pxf.io/3evZdB)
- GitOps by [Flux](https://fluxcd.io/)
- Infrastructure by [Terraform](https://terraform.io/)
- Secrets by [External Secrets Operator](https://external-secrets.io/)

---

**Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.