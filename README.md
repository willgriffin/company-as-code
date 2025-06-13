# Startup GitOps Template

🚀 **One-click Kubernetes deployment template** for complete infrastructure with GitOps on [DigitalOcean](https://digitalocean.pxf.io/3evZdB).

[![Deploy](https://img.shields.io/badge/Deploy-DigitalOcean-blue?style=for-the-badge&logo=digitalocean)](../../actions/workflows/cluster-deploy.yml)
[![Use Template](https://img.shields.io/badge/Use-Template-green?style=for-the-badge&logo=github)](../../generate)

> **Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.

## 🌟 What This Template Provides

Deploy a complete, production-ready Kubernetes infrastructure in minutes:

> **Template Note**: This template includes secret templates (`.yaml` files) but not encrypted secrets (`.enc.yaml` files). Encrypted secrets are automatically generated during your first deployment with your own unique encryption keys.

### 🏗️ **Infrastructure**
- **[DigitalOcean](https://digitalocean.pxf.io/3evZdB) Kubernetes Cluster** - Managed Kubernetes with auto-scaling
- **Kong Gateway** - API Gateway with OIDC authentication and AI expense tracking
- **GitOps with Flux v2** - Automated deployments from Git
- **Automatic DNS** - DigitalOcean DNS integration with external-dns
- **TLS Certificates** - Automatic cert-manager with Let's Encrypt

### 🚀 **Applications** (All Optional)
- **🔐 Keycloak** - Identity and access management (`auth.yourdomain.com`)
- **💬 Mattermost** - Team chat and collaboration (`chat.yourdomain.com`)  
- **☁️ Nextcloud** - Cloud storage and office suite (`cloud.yourdomain.com`)
- **📧 Mailu** - Complete email server (`mail.yourdomain.com`)
- **📮 Postal** - Mail processing with RabbitMQ (`postal.yourdomain.com`)
- **🤖 AI Gateway** - LiteLLM proxy with multi-provider support (`ai.yourdomain.com`)

## 🚀 Quick Start

### 1. Use This Template

Click the **"Use this template"** button above to create your own repository.

📝 **Configuration Form**: GitHub will show a form where you can specify:
- Your domain name
- Cluster name and region  
- Which services to enable (Nextcloud, Mattermost, etc.)
- Monitoring preferences

✨ **Automatic Initialization**: Your new repository will be automatically configured with your form responses and converted to standard Kubernetes YAML. No manual setup needed!

### 2. Set Up Required Secrets

In your new repository, go to **Settings → Secrets and variables → Actions** and add:

- **`DIGITALOCEAN_TOKEN`** - Your DigitalOcean API token ([https://cloud.digitalocean.com/account/api/tokens](https://digitalocean.pxf.io/je2Ggv))

> **Note**: Spaces access keys for Terraform state storage are automatically created during deployment. No manual setup required!

**Note**: The template uses GitHub's built-in `GITHUB_TOKEN`. If you encounter permission issues, check **Settings → Actions → General → Workflow permissions** and select "Read and write permissions".

### 3. Configure Your Deployment

```bash
# Clone your new repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Copy and customize configuration
cp config.yaml.example config.yaml
# Edit config.yaml with your domain and preferences
```

**Important**: Set up your domain in DigitalOcean DNS before deploying.

### 4. Deploy! 🚀

```bash
# Commit your configuration
git add config.yaml
git commit -m "feat: configure deployment settings"
git push
```

That's it! GitHub Actions will automatically deploy your entire infrastructure. Monitor progress in the **Actions** tab.

## 📋 Configuration Options

Edit `config.yaml` to customize your deployment:

```yaml
# Domain setup
domain:
  primary: "yourdomain.com"    # Your domain (required)

# Cluster configuration  
cluster:
  name: "cumulus"             # Cluster name
  region: "nyc3"              # DigitalOcean region
  node_size: "s-1vcpu-2gb"    # Node size
  min_nodes: 2                # Min nodes
  max_nodes: 3                # Max nodes

# Enable/disable services
services:
  keycloak:
    enabled: true             # Identity management
  mattermost:
    enabled: true             # Team chat
  nextcloud:
    enabled: true             # Cloud storage
  mailu:
    enabled: true             # Email server
```

## 🎛️ Management

### Manual Deployment Trigger
Go to **Actions → Deploy Kubernetes Cluster → Run workflow**

### Destroy Infrastructure  
Go to **Actions → Deploy Kubernetes Cluster → Run workflow** and check "Destroy cluster"

### Monitor Deployment
- **GitHub Actions**: Check the Actions tab for deployment progress
- **Kubernetes**: Access your cluster using the generated kubeconfig

## 🔧 How It Works

This template uses modern DevOps practices for reliable, automated infrastructure:

### GitOps with Flux v2
- **Infrastructure-managed** - Flux bootstrap handled by Terraform
- **Automatic reconciliation** - Changes in Git automatically deployed to cluster
- **Health checks** - Automatic rollback on deployment failures

### Architecture
```
GitHub Repository (GitOps Source)
        ↓
   GitHub Actions (CI/CD)
        ↓  
   Terraform (Infrastructure)
        ↓
   DigitalOcean Kubernetes
        ↓
   Flux (GitOps Controller)
        ↓
   Applications (Deployed automatically)
```

## 📁 Repository Structure

```
your-kubernetes-project/
├── config.yaml              # 📝 Your deployment configuration
├── terraform/                # 🏗️ Infrastructure as Code
│   └── digitalocean/         # DigitalOcean Kubernetes cluster
├── flux/                     # 🔄 GitOps configurations  
│   └── clusters/cumulus/     # Cluster-specific deployments
├── .github/                  # 🚀 GitHub Actions workflows
│   ├── workflows/            # Deployment automation
│   └── actions/              # Reusable validation steps
└── scripts/                  # 🛠️ Utility scripts
```

## 📚 Documentation

- **[Template Setup Guide](./TEMPLATE_SETUP.md)** - Detailed setup instructions
- **[Terraform Documentation](./terraform/)** - Infrastructure details
- **[Flux Documentation](./flux/)** - GitOps deployment details

## 🆘 Troubleshooting

### Common Issues

**❌ Configuration validation failed**
- Update placeholder values in `config.yaml`
- Ensure domain is set up in DigitalOcean DNS

**❌ Missing GitHub secrets**  
- Add `DIGITALOCEAN_TOKEN` and `GITHUB_TOKEN` in repository settings

**⏳ Deployment taking too long**
- Applications can take 10-15 minutes to fully deploy
- Monitor progress in Actions tab and check pod status

## 🌟 Features

### 🔐 **Security First**
- Automatic TLS certificates
- OAuth/OIDC integration
- Network policies and RBAC

### ⚡ **Production Ready**  
- High availability setup with Kong Gateway
- Auto-scaling nodes with load balancing
- Comprehensive monitoring (Prometheus, Grafana, Jaeger)
- AI usage tracking and expense monitoring
- Automatic TLS certificates and DNS management
- Backup strategies and disaster recovery

### 🛠️ **Developer Friendly**
- One-command deployment
- GitOps workflow
- Infrastructure as Code
- Conventional commits

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with:
- [Terraform](https://terraform.io) - Infrastructure as Code
- [Flux](https://fluxcd.io) - GitOps toolkit  
- [Kubernetes](https://kubernetes.io) - Container orchestration
- [DigitalOcean](https://digitalocean.pxf.io/3evZdB) - Cloud infrastructure

---

⭐ **Star this repository** if you find it useful!