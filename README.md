# Blueprint

Infrastructure as Code monorepo for Kubernetes deployments using GitOps.

## Overview

This repository manages cloud infrastructure and Kubernetes applications through:
- **[Terraform](./terraform/)** - Infrastructure provisioning  
- **[Flux Operator](./flux/)** - GitOps continuous delivery with declarative Flux management
- **SOPS + Age** - Encrypted secret management
- **Conventional Commits** - Standardized commit messages for automation

## Quick Start

### Prerequisites
- [age](https://github.com/FiloSottile/age) - For secret encryption
- [sops](https://github.com/getsops/sops) - For secret management  
- [kubectl](https://kubernetes.io/docs/tasks/tools/) - For Kubernetes cluster access
- [direnv](https://direnv.net/) - For environment management
- [terraform](https://developer.hashicorp.com/terraform/downloads) - For infrastructure provisioning

### One-Time Setup

1. **Configure Secrets**
   ```bash
   # Copy the example secrets file
   cp .envrc.secrets.example .envrc.secrets
   
   # Edit .envrc.secrets with your tokens (GitHub, DigitalOcean, etc)
   $EDITOR .envrc.secrets
   
   # Run initial setup to generate age keys and configure SOPS
   ./scripts/initial-setup
   
   # Generate secure passwords for applications
   ./scripts/generate-secrets
   
   # Sync secrets to GitHub for CI/CD workflows
   ./scripts/secrets-sync-to-github
   
   # Allow direnv to load the environment
   direnv allow
   ```

2. **Create Cluster** (Single Command!)
   ```bash
   # This does everything: provisions infrastructure, deploys Flux Operator, sets up GitOps
   ./scripts/cluster-create
   ```

### Cluster Management

**Create/Recreate Cluster:**
```bash
./scripts/cluster-create
```

**Destroy Cluster:**
```bash
./scripts/cluster-destroy
```

**Check Status:**
```bash
# Check Flux Operator status
kubectl get fluxinstance flux -n flux-system

# Check GitOps sync status  
kubectl get gitrepository -n flux-system
kubectl get kustomizations -n flux-system

# Check application pods
kubectl get pods -A
```

### GitOps with Flux Operator

This repository uses the **Flux Operator** for declarative GitOps management:

- **Declarative Flux Management** - Flux is configured via `FluxInstance` custom resource
- **Built-in SOPS Support** - Automatic secret decryption with age keys
- **No Bootstrap Required** - Deploy Flux like any other Kubernetes application
- **Easy Upgrades** - Update Flux version by modifying the `FluxInstance` spec

**Manual Flux Management:**
```bash
# Deploy Flux Operator (run after cluster creation)
./scripts/flux-operator-deploy

# Uninstall Flux completely
./scripts/flux-operator-uninstall

# Check Flux Operator logs
kubectl logs -n flux-operator-system deployment/flux-operator
```

## Repository Structure

```
blueprint/
├── terraform/              # Infrastructure as Code
│   ├── digitalocean/      # DigitalOcean Kubernetes cluster
│   └── README.md          # Terraform documentation
├── flux/                   # GitOps configurations
│   ├── clusters/          # Cluster-specific deployments
│   │   └── cumulus/       # DigitalOcean cluster
│   └── README.md          # Flux documentation
├── scripts/                # Utility scripts
│   ├── kubeconfig-get     # Retrieve kubeconfig from Terraform
│   ├── kubeconfig-update-local      # Update local ~/.kube config
│   └── kubeconfig-update-repo-secret # Update GitHub secret
└── CLAUDE.md              # AI assistant context
```

## Documentation

- **[Terraform Documentation](./terraform/)** - Infrastructure provisioning guides
- **[Flux Documentation](./flux/)** - GitOps deployment guides
- **[GitHub Actions Workflows](./.github/workflows/)** - CI/CD automation

## Utility Scripts

### Kubeconfig Management

After deploying the cluster with Terraform, use these scripts to manage kubeconfig:

```bash
# Get kubeconfig from Terraform output
./scripts/kubeconfig-get

# Update local ~/.kube/have-[hostname].config
./scripts/kubeconfig-update-local

# Update GitHub repository KUBECONFIG secret
./scripts/kubeconfig-update-repo-secret
```

## Prerequisites

- Terraform >= 1.0
- kubectl
- flux CLI
- DigitalOcean account
- GitHub repository access

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for standardized commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts

**Examples:**
```bash
git commit -m "feat: add prometheus monitoring stack"
git commit -m "fix: correct ingress nginx configuration"
git commit -m "docs: update deployment instructions"
git commit -m "chore: update terraform digitalocean provider"
```

**Breaking changes:**
```bash
git commit -m "feat!: migrate to managed kubernetes cluster

BREAKING CHANGE: removes self-managed k3s setup"
```

## Support

- [Terraform DigitalOcean Provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- [Flux Documentation](https://fluxcd.io/flux/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## License

MIT