# k3s Multicloud GitOps Template

A production-ready GitHub template for deploying self-managed k3s Kubernetes clusters on any cloud provider with GitOps, multi-tenancy, and enterprise applications. Supports Hetzner and [DigitalOcean](https://digitalocean.pxf.io/3evZdB) out of the box, with infrastructure provisioned via CDKTF (Terraform CDK) and continuous deployment managed by Flux v2.

## Features

### Infrastructure and Networking
- **Self-managed k3s clusters** on VPS instances (Hetzner or DigitalOcean Droplets)
- **Infrastructure as Code** using CDKTF (Terraform CDK) with TypeScript
- **GitOps workflow** with Flux v2 for continuous deployment
- **NGINX Ingress Controller** for HTTP/HTTPS traffic routing
- **MetalLB** for bare-metal L2 load balancing
- **Tailscale Operator** for inter-node VPN mesh networking
- **External-DNS** with AWS Route53 provider for automatic DNS record management
- **cert-manager** with Let's Encrypt for automatic TLS certificate provisioning

### Identity and Authentication
- **Dex** as centralized OIDC identity provider
- **OAuth2-Proxy** for protecting dashboards and web applications
- **Per-tenant Kanidm** instances for tenant-level identity management

### Databases and Storage
- **CloudNativePG** operator for high-availability PostgreSQL clusters
- **OpsTree Redis Operator** for distributed Redis caching and session storage
- **Velero** for cluster-wide backup and disaster recovery

### Secret Management
- **SOPS + age** encryption for secrets stored directly in Git
- Template-based secret workflow with `*.secret.template.yaml` and `*.secret.enc.yaml` patterns

### Monitoring and Operations
- **Prometheus** for metrics collection and alerting
- **Grafana** for dashboards and visualization
- **Sablier** for scale-to-zero workload hibernation

### Applications
- **Mattermost** - Team collaboration with Dex OIDC integration
- **Nextcloud** - Cloud storage with Dex OIDC integration
- **Forgejo** - Self-hosted Git forge with Dex OIDC integration
- **Homepage** - Customizable dashboard with OAuth2-Proxy authentication
- **AI Gateway / LiteLLM** - AI service proxy with OAuth2-Proxy authentication

### Multi-Tenancy
- **Per-tenant service isolation** with dedicated identity, email, database, cache, and DNS
- **Example tenant** (`example-org`) demonstrating the full tenant pattern
- Kanidm, Stalwart Mail, CloudNativePG, Redis, and External-DNS per tenant

## Prerequisites

- **Node.js 22+** with **bun** package manager
- **age** for encryption key generation
- **sops** for secret encryption/decryption
- **flux** CLI for GitOps bootstrapping
- **kubectl** for Kubernetes cluster management
- **terraform** (used via CDKTF)
- A **cloud provider account** (Hetzner or [DigitalOcean](https://digitalocean.pxf.io/3evZdB))
- A **domain name** managed via AWS Route53
- An **AWS account** for Route53 DNS management and S3 Terraform state storage

## Quick Start

### 1. Use This Template

Click the "Use this template" button on GitHub to create your own repository.

### 2. Clone and Install

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
bun install
```

### 3. Generate an Age Key Pair

```bash
age-keygen -o age.key
```

Save the public key output for the next step. Keep `age.key` safe and never commit it to Git.

### 4. Update `.sops.yaml` with Your Public Key

Edit `.sops.yaml` and replace the existing age public key with your own:

```yaml
creation_rules:
  - path_regex: \.secret\.enc\.yaml$
    age: "age1your-public-key-here"
```

### 5. Search and Replace Template Domain

Replace `TEMPLATE_DOMAIN` throughout the repository with your actual domain:

```bash
grep -rl 'TEMPLATE_DOMAIN' manifests/ | xargs sed -i '' 's/TEMPLATE_DOMAIN/yourdomain.com/g'
```

### 6. Encrypt Secrets

For each secret template file, create an encrypted copy and fill in your values:

```bash
# Copy the template
cp path/to/file.secret.template.yaml path/to/file.secret.enc.yaml

# Edit the file with your actual secret values
# Then encrypt it in place
sops -e -i path/to/file.secret.enc.yaml
```

Repeat for all `*.secret.template.yaml` files in the repository.

### 7. Deploy Infrastructure

```bash
cd infrastructure/hetzner  # or infrastructure/digitalocean
bun install
npx cdktf deploy
```

### 8. Install k3s on Nodes

Follow the k3s installation instructions for your provisioned VPS nodes. Configure the first node as the server and join additional nodes as agents.

### 9. Bootstrap Flux

```bash
flux bootstrap github \
  --owner=<your-github-org> \
  --repository=<your-repo-name> \
  --path=manifests/clusters/my-cluster \
  --personal
```

Flux will begin reconciling the cluster state from the manifests in your repository.

## Project Structure

```
.
├── .github/
│   ├── workflows/         # CI/CD pipelines
│   └── actions/           # Custom actions (setup-tools, validate-config, check-repository-status)
├── infrastructure/        # CDKTF infrastructure (multicloud)
│   ├── hetzner/           # Hetzner VPS + LB + private network
│   └── digitalocean/      # DigitalOcean Droplets + VPC + firewall
├── manifests/
│   ├── clusters/
│   │   └── my-cluster/    # Cluster orchestration (system.yaml, applications.yaml, tenants.yaml)
│   ├── system/            # Core system components
│   │   ├── cert-manager/
│   │   ├── dex/
│   │   ├── external-dns/
│   │   ├── grafana/
│   │   ├── metallb/
│   │   ├── nginx-ingress/
│   │   ├── oauth2-proxy/
│   │   ├── postgresql-operator/
│   │   ├── prometheus/
│   │   ├── redis-operator/
│   │   ├── sablier/
│   │   ├── tailscale-operator/
│   │   └── velero/
│   ├── applications/      # Application deployments
│   │   ├── ai-gateway/
│   │   ├── forgejo/
│   │   ├── homepage/
│   │   ├── mattermost/
│   │   └── nextcloud/
│   ├── tenants/           # Multi-tenant configurations
│   │   └── example-org/   # Example tenant (kanidm, stalwart, postgres, redis, external-dns)
│   └── shared/
│       └── config/        # Shared ConfigMaps (infrastructure-config, resource-profiles)
├── archive/               # Archived legacy components
├── docs/                  # Technical documentation
├── tool-versions.txt      # Tool versions for CI/CD caching
├── .sops.yaml             # SOPS encryption rules
└── package.json           # Root package (bun)
```

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Infrastructure | CDKTF (Terraform CDK) | Multicloud VPS provisioning (Hetzner, DigitalOcean) |
| Kubernetes | k3s | Lightweight, self-managed Kubernetes distribution |
| GitOps | Flux v2 | Continuous deployment from Git |
| Ingress | NGINX Ingress Controller | HTTP/HTTPS traffic routing and TLS termination |
| Load Balancer | MetalLB | Bare-metal L2 load balancer for service IPs |
| VPN | Tailscale Operator | Encrypted inter-node mesh networking |
| DNS | External-DNS + Route53 | Automatic DNS record management |
| TLS | cert-manager + Let's Encrypt | Automatic certificate provisioning and renewal |
| Identity | Dex | Centralized OIDC provider federated across applications |
| Auth Proxy | OAuth2-Proxy | Authentication proxy for dashboard protection |
| Tenant Identity | Kanidm | Per-tenant identity provider |
| Database | CloudNativePG | High-availability PostgreSQL with automatic failover |
| Cache | OpsTree Redis Operator | Distributed Redis for caching and sessions |
| Secrets | SOPS + age | Git-native encrypted secret management |
| Monitoring | Prometheus + Grafana | Metrics collection, alerting, and visualization |
| Backups | Velero | Cluster-wide backup and disaster recovery |
| Scale-to-zero | Sablier | Workload hibernation for idle services |
| State Storage | AWS S3 | Terraform state with versioning and encryption |

### Deployment Flow

1. **CDKTF** provisions VPS nodes, load balancers, and networking on your chosen cloud provider
2. **k3s** is installed on provisioned nodes to form the Kubernetes cluster
3. **Flux** is bootstrapped to the cluster, pointing at your Git repository
4. **SOPS-encrypted secrets** are decrypted at reconciliation time by Flux's kustomize-controller
5. **System components** deploy first (ingress, DNS, TLS, identity, databases)
6. **Applications** deploy with automatic OIDC integration via Dex
7. **Tenants** deploy with isolated per-tenant services
8. **GitOps** continuously syncs changes pushed to the repository

## Secret Management

This template uses **SOPS + age** for Git-native secret encryption. Secrets are encrypted and committed directly to the repository, then decrypted at deploy time by Flux's kustomize-controller.

### Workflow

1. **Template files** (`*.secret.template.yaml`) contain the secret structure with placeholder values. These are committed to Git unencrypted as reference.
2. **Encrypted files** (`*.secret.enc.yaml`) contain your actual secret values, encrypted with your age public key. These are committed to Git encrypted.
3. **Flux decryption** is configured via a `decryption` block in each Kustomization resource, pointing to the age private key stored as a Kubernetes secret on the cluster.

### Creating and Updating Secrets

```bash
# Create from template
cp manifests/system/dex/dex.secret.template.yaml manifests/system/dex/dex.secret.enc.yaml

# Edit with your values, then encrypt in place
sops -e -i manifests/system/dex/dex.secret.enc.yaml

# To edit an existing encrypted secret
sops manifests/system/dex/dex.secret.enc.yaml
```

### Encryption Rules

The `.sops.yaml` file at the repository root defines which files are encrypted and with which key:

```yaml
creation_rules:
  - path_regex: \.secret\.enc\.yaml$
    age: "age1your-public-key-here"
```

## Multi-Tenancy

The template supports a multi-tenant architecture where each organization (tenant) receives isolated infrastructure services.

### Tenant Model

Each tenant under `manifests/tenants/<org-name>/` gets:

- **Kanidm** - Dedicated identity provider for the tenant's users
- **Stalwart Mail** - Full-featured email server for the tenant's domain
- **CloudNativePG PostgreSQL** - Dedicated database cluster
- **OpsTree Redis** - Dedicated cache instance
- **External-DNS** - DNS record management for the tenant's domain

### Adding a New Tenant

1. Copy the `example-org` directory under `manifests/tenants/`
2. Update namespace, domain, and configuration values
3. Create and encrypt tenant-specific secrets
4. Add the tenant Kustomization reference to your cluster's `tenants.yaml`
5. Commit and push -- Flux will deploy the tenant's services automatically

## Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Application Setup](docs/APPLICATIONS.md)
- [Secret Management](docs/SECRETS.md)
- [Workflow](WORKFLOW.md) - Development workflow and issue management

## Contributing

This is a production-grade template. To contribute, you will need:

- **Node.js 22+** and **bun** for development
- **TypeScript** knowledge for CDKTF infrastructure development
- **Kubernetes** experience for manifest customization
- Familiarity with **Flux v2** GitOps patterns

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Cloud hosting by [DigitalOcean](https://digitalocean.pxf.io/3evZdB) and [Hetzner](https://www.hetzner.com/)
- GitOps by [Flux](https://fluxcd.io/)
- Infrastructure by [CDKTF](https://developer.hashicorp.com/terraform/cdktf)
- Kubernetes distribution by [k3s](https://k3s.io/)
- Secret encryption by [SOPS](https://github.com/getsops/sops) and [age](https://github.com/FiloSottile/age)

---

**Note**: Links to DigitalOcean are affiliate links that support the maintenance of this template.
