# Blueprint

Infrastructure as Code monorepo for Kubernetes deployments using GitOps.

## Overview

This repository manages cloud infrastructure and Kubernetes applications through:
- **[Terraform](./terraform/)** - Infrastructure provisioning
- **[Flux](./flux/)** - GitOps continuous delivery
- **Conventional Commits** - Standardized commit messages for automation

## Quick Start

1. **Provision Infrastructure**
   ```bash
   cd terraform/digitalocean
   terraform init && terraform apply
   ```

2. **Bootstrap Flux**
   ```bash
   flux bootstrap git \
     --url=https://github.com/happyvertical/blueprint \
     --branch=main \
     --path=flux/clusters/cumulus
   ```

3. **Deploy Applications**
   ```bash
   # Applications deploy automatically via GitOps
   git add flux/clusters/cumulus/my-app/
   git commit -m "feat: deploy my-app"
   git push
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