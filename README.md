# GitOps Infrastructure Template

A modern, production-ready infrastructure template for deploying Kubernetes applications on [DigitalOcean](https://digitalocean.pxf.io/3evZdB) using GitOps principles with Flux, TypeScript, and Terraform CDK.

## 🚀 Features

- **TypeScript-based Infrastructure as Code** using Terraform CDK (CDKTF)
- **GitOps workflow** with Flux v2 for continuous deployment
- **Production-ready Kubernetes** clusters on DigitalOcean
- **Integrated applications** (optional):
  - 🔐 **Keycloak** - Identity and Access Management
  - 💬 **Mattermost** - Team collaboration platform
  - ☁️ **Nextcloud** - File storage and productivity suite
  - 📧 **Mailu** - Full-featured email server
- **Enterprise features**:
  - 🔒 Automatic SSL/TLS with cert-manager and Let's Encrypt
  - 📊 Monitoring with Prometheus and Grafana (optional)
  - 💾 Automated backups with Velero (optional)
  - 🌐 DNS management with External DNS
  - 🛡️ OAuth2 proxy for authentication

## 📋 Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **[DigitalOcean account](https://digitalocean.pxf.io/3evZdB)** with API token
- **GitHub account** for GitOps repository
- **Domain name** with DNS pointing to DigitalOcean
- **AWS account** (optional, for email features)

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/your-gitops-repo.git
cd your-gitops-repo

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
DIGITALOCEAN_TOKEN=dop_v1_your_token_here

# Optional (for email features)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### 3. Initialize Configuration

Run the interactive setup:

```bash
pnpm cli init --interactive
```

This will guide you through:
- Project naming and domain setup
- Cluster region and size selection
- Application selection
- Feature configuration

### 4. Deploy Infrastructure

```bash
# Deploy everything
pnpm cli deploy

# Or deploy specific environment
pnpm cli deploy --environment production
```

## 📁 Project Structure

```
.
├── cli/                    # CLI tool for managing deployments
│   ├── src/
│   │   ├── commands/      # CLI commands (init, deploy, status, destroy)
│   │   ├── providers/     # Cloud provider integrations
│   │   └── utils/         # Utility functions
│   └── package.json
│
├── platform/              # CDKTF infrastructure definitions
│   ├── src/
│   │   ├── stacks/       # Terraform CDK stacks
│   │   ├── constructs/   # Reusable CDKTF constructs
│   │   └── config/       # Configuration schemas
│   ├── cdktf.json        # CDKTF configuration
│   └── package.json
│
├── flux/                  # GitOps manifests
│   ├── clusters/         # Cluster-specific configurations
│   └── infrastructure/   # Core infrastructure components
│
└── docs/                 # Additional documentation
```

## 🔧 CLI Commands

### Initialize a new project
```bash
pnpm cli init [options]
  --interactive    Run interactive setup wizard
  --config <path>  Load from existing config file
```

### Deploy infrastructure
```bash
pnpm cli deploy [options]
  --environment <name>  Deploy specific environment
  --config <path>       Use custom config file
```

### Check deployment status
```bash
pnpm cli status [options]
  --environment <name>  Check specific environment
  --detailed           Show detailed component status
```

### Destroy infrastructure
```bash
pnpm cli destroy [options]
  --environment <name>  Destroy specific environment
  --confirm            Skip confirmation prompts
```

### Validate configuration
```bash
pnpm cli config validate [options]
  --config <path>  Path to config file
```

## 🏗️ Architecture

### Technology Stack

- **Infrastructure as Code**: Terraform CDK with TypeScript
- **Container Orchestration**: Kubernetes (DigitalOcean Kubernetes)
- **GitOps**: Flux v2 for continuous deployment
- **Ingress**: Traefik with automatic SSL
- **DNS**: External DNS for automatic record management
- **Secrets**: SOPS with Age encryption
- **Databases**: CloudNativePG (PostgreSQL operator)
- **Caching**: Redis operator

### Configuration Schema

The project uses Zod for runtime configuration validation. Example configuration:

```json
{
  "project": {
    "name": "my-startup",
    "domain": "example.com",
    "email": "admin@example.com"
  },
  "environments": [
    {
      "name": "production",
      "cluster": {
        "region": "nyc3",
        "nodeSize": "s-2vcpu-4gb",
        "nodeCount": 3
      }
    }
  ],
  "features": {
    "email": true,
    "monitoring": true,
    "backup": true,
    "ssl": true
  },
  "applications": ["keycloak", "mattermost", "nextcloud"]
}
```

## 🔐 Security

- **Secrets encryption** at rest using SOPS and Age
- **Network policies** for pod-to-pod communication
- **RBAC** for Kubernetes access control
- **Automatic TLS** certificates from Let's Encrypt
- **OAuth2 proxy** for application authentication

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Terraform CDK](https://developer.hashicorp.com/terraform/cdktf)
- Powered by [DigitalOcean Kubernetes](https://digitalocean.pxf.io/3evZdB)
- GitOps by [Flux](https://fluxcd.io/)

---

**Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.