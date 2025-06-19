# Enterprise GitOps Template

A production-ready GitHub template repository for deploying enterprise-grade Kubernetes infrastructure on [DigitalOcean](https://digitalocean.pxf.io/3evZdB) using GitOps principles with Flux v2 and advanced CDKTF orchestration.

## 🚀 Features

- **Enterprise GitOps workflow** with Flux v2 for continuous deployment
- **Infrastructure as Code** using CDKTF (Terraform CDK) with TypeScript
- **Production-ready Kubernetes** on DigitalOcean with high availability
- **Advanced API Gateway** with Kong Gateway and OIDC integration
- **Dynamic secret management** using External Secrets Operator
- **Integrated enterprise applications**:
  - 🔐 **Keycloak** - Identity and Access Management with operator
  - 💬 **Mattermost** - Team collaboration with OIDC
  - ☁️ **Nextcloud** - Enterprise cloud storage solution
  - 📧 **Mailu/Postal** - Full-featured email servers
- **Enterprise infrastructure**:
  - 🌐 Kong Gateway with Gateway API and advanced routing
  - 🔒 Automatic SSL/TLS with cert-manager
  - 🔑 External Secrets Operator for dynamic secret injection
  - 🌐 DNS management with External DNS
  - 🐘 High-availability PostgreSQL clusters with CloudNativePG
  - 🚀 Redis caching with Redis Operator
  - 📊 Comprehensive monitoring with Prometheus and Grafana
  - 💾 Automated backups with Velero

## 📋 Prerequisites

- **Node.js 22+** with PNPM package manager
- **[DigitalOcean account](https://digitalocean.pxf.io/3evZdB)** with [API token](https://digitalocean.pxf.io/je2Ggv)
- **GitHub account** with personal access token
- **Domain name** configured with DigitalOcean DNS
- **AWS account** for S3 Terraform state storage and SES email

## 🛠️ Quick Start

### 1. Use This Template

Click the "Use this template" button on GitHub to create your own repository from this template.

### 2. Clone and Setup

```bash
# Clone your new repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Ensure you have Node.js 22+ and pnpm installed
node --version  # Should be 22+
pnpm --version  # Install with: npm install -g pnpm

# Run the interactive setup script
./setup.ts
```

### 3. Interactive Setup (Recommended)

The `setup.ts` script provides an interactive setup that will:

- **Create configuration**: Generate `platform/config.json` with your infrastructure settings
- **Authenticate services**: Guide you through DigitalOcean, AWS, and GitHub authentication
- **Provision prerequisites**:
  - Create AWS S3 bucket for Terraform state (with versioning and encryption)
  - Set up AWS SES credentials for email functionality
- **Configure GitHub**: Set repository secrets automatically
- **Setup project management**: Create workflow labels and optional project board

### 4. Environment Variable Setup (CI/CD)

For automated environments, provide configuration via environment variables:
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

### 5. Deploy Infrastructure

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

Deploy the infrastructure using CDKTF:
```bash
cd platform
pnpm install
npx cdktf deploy
```

## 📁 Project Structure

```
.
├── .github/
│   ├── workflows/         # CI/CD pipelines with GitHub Actions
│   └── actions/          # Custom actions for tool setup and validation
├── manifests/            # GitOps manifests (formerly flux/)
│   ├── clusters/         # Cluster-specific configurations
│   │   └── my-cluster/   # Production cluster manifests
│   ├── applications/     # Application deployments
│   └── infrastructure/   # Core infrastructure components
├── platform/            # CDKTF infrastructure (TypeScript)
│   ├── src/
│   │   ├── stacks/      # Terraform CDK stacks
│   │   ├── config/      # Configuration schema and validation
│   │   └── main.ts      # CDKTF entry point
│   ├── config.json      # Generated infrastructure configuration
│   └── cdktf.json       # CDKTF framework configuration
├── scripts/             # Automation and utility scripts
├── docs/               # Technical documentation
├── setup.ts            # Interactive setup script
└── tool-versions.txt   # Tool version specifications for CI/CD
```

## 🔧 Architecture

### Technology Stack

- **Infrastructure**: CDKTF (Terraform CDK) with TypeScript for type-safe infrastructure
- **Kubernetes**: DigitalOcean Kubernetes (DOKS) with high availability
- **GitOps**: Flux v2 for continuous deployment from Git
- **API Gateway**: Kong Gateway with Gateway API, OIDC, and advanced routing
- **Certificates**: cert-manager with Let's Encrypt automation
- **DNS**: External DNS with DigitalOcean provider
- **Secrets**: External Secrets Operator with dynamic injection from external stores
- **Databases**: CloudNativePG operator for high-availability PostgreSQL clusters
- **Caching**: Redis Operator for distributed caching
- **Identity**: Keycloak with custom operator for enterprise SSO
- **Storage**: DigitalOcean Spaces managed automatically by CDKTF
- **Monitoring**: Prometheus and Grafana with ServiceMonitors
- **Backups**: Velero for cluster-wide backup and disaster recovery

### CDKTF Stacks

1. **DigitalOceanClusterStack** - Kubernetes cluster with node pools
2. **DigitalOceanSpacesStack** - Object storage managed by CDKTF
3. **AWSSESStack** - Email infrastructure with SES
4. **GitHubSecretsStack** - Automated repository secret management
5. **FluxConfigurationStack** - GitOps bootstrap and configuration

### Deployment Flow

1. **Setup Script** creates prerequisites (S3 bucket, secrets)
2. **CDKTF** provisions cloud infrastructure via typed TypeScript stacks
3. **Flux** is bootstrapped to the cluster with GitHub integration
4. **External Secrets Operator** is deployed for dynamic secret management
5. **Kong Gateway** provides enterprise API gateway with OIDC
6. **Applications** deploy with automatic secret injection and OIDC integration
7. **GitOps** continuously syncs changes from the Git repository

## 🔐 Secret Management

This template uses **External Secrets Operator (ESO)** for enterprise-grade secret management:

- **Dynamic Secret Injection**: Secrets are fetched from external stores at runtime
- **Multiple Backends**: Support for GitHub, AWS Secrets Manager, DigitalOcean, and more
- **Automatic Rotation**: Secrets can be automatically rotated and updated
- **Kubernetes Native**: Integrates seamlessly with Kubernetes RBAC and namespaces

## 📚 Documentation

- [Architecture Details](docs/ARCHITECTURE.md) - Deep dive into system architecture
- [Deployment Guide](docs/DEPLOYMENT.md) - Complete deployment walkthrough
- [Application Setup](docs/APPLICATIONS.md) - Configuring applications with OIDC
- [Secret Management](docs/SECRETS.md) - External Secrets Operator usage
- [Configuration](docs/CONFIGURATION.md) - TypeScript configuration options
- [Workflow](WORKFLOW.md) - Development workflow and issue management

## 🚀 Advanced Features

### Kong Gateway Integration

This template includes enterprise-grade API gateway features:

- **Gateway API**: Modern Kubernetes networking with HTTPRoute resources
- **OIDC Authentication**: Integrated with Keycloak for single sign-on
- **Rate Limiting**: Built-in protection against abuse
- **Monitoring**: Comprehensive metrics and observability
- **Redis Sessions**: Distributed session storage

### High-Availability PostgreSQL

Applications use CloudNativePG for enterprise database features:

- **Cluster Mode**: 3-replica clusters for high availability
- **Automatic Failover**: Built-in leader election and failover
- **Backup Integration**: Automated backups to object storage
- **Performance Monitoring**: Advanced metrics and alerting

### Application Features

- **Nextcloud**: Enterprise cloud storage with advanced features
- **Mattermost**: Full OIDC integration with Keycloak for SSO
- **Keycloak**: Deployed via operator with advanced realm configuration
- **Email Servers**: Choice of Mailu or Postal with OAuth2 proxy integration

## 🤝 Contributing

This is an enterprise-grade template requiring:

- **Node.js 22+** and **PNPM** for development
- **TypeScript** knowledge for CDKTF stack development
- **Kubernetes** experience for manifest customization

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Powered by [DigitalOcean Kubernetes](https://digitalocean.pxf.io/3evZdB)
- GitOps by [Flux](https://fluxcd.io/)
- Infrastructure by [CDKTF](https://developer.hashicorp.com/terraform/cdktf)
- API Gateway by [Kong](https://konghq.com/)
- Secrets by [External Secrets Operator](https://external-secrets.io/)

---

**Note**: Links to DigitalOcean are affiliate links that support the maintenance of this template.