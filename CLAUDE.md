# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an infrastructure monorepo for managing Kubernetes deployments on DigitalOcean using GitOps practices with Flux. The repository follows Infrastructure as Code principles using Terraform and Kustomize.

## Common Commands

### Terraform Operations
```bash
# Initialize Terraform in the DigitalOcean directory
cd terraform/digitalocean
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure (use with caution)
terraform destroy
```

### Flux Operations
```bash
# Bootstrap Flux in the cluster
flux bootstrap git --url=https://github.com/happyvertical/blueprint

# Check Flux reconciliation status
flux get all

# Force reconciliation
flux reconcile source git flux-system

# Check specific kustomization
flux get kustomization <name>
```

### Kubernetes Operations
```bash
# Get all resources in a namespace
kubectl get all -n <namespace>

# View pod logs
kubectl logs -n <namespace> <pod-name>

# Describe a resource
kubectl describe -n <namespace> <resource-type>/<resource-name>
```

## Architecture & Structure

### Directory Layout
- **terraform/** - Infrastructure provisioning
  - `digitalocean/` - Kubernetes cluster configuration
  - `modules/` - Reusable Terraform modules for common patterns
  
- **flux/** - GitOps manifests and configurations
  - `flux-system/` - Core Flux components
  - `cert-manager/` - TLS certificate automation
  - `ingress-nginx/` - Ingress controller for external traffic
  - `prometheus/` - Monitoring and observability stack
  - Service directories follow pattern: `<service-name>/`

### Key Architectural Decisions
1. **Single DigitalOcean Kubernetes cluster** - All services run in one cluster
2. **GitOps deployment model** - All deployments through Git commits
3. **Branch-based testing** - Feature branches automatically deploy to test environments
4. **Kustomize for configuration** - No Helm charts, pure Kubernetes manifests with Kustomize overlays

### Deployment Flow
1. Infrastructure changes: Modify Terraform files → Apply changes
2. Application deployments: Update manifests in `flux/` → Commit → Flux syncs automatically
3. Secret management: Use Kubernetes secrets, reference in deployments

## Development Workflow

### Adding a New Service
1. Create directory under `flux/<service-name>/`
2. Add Kubernetes manifests (deployment.yaml, service.yaml, etc.)
3. Create kustomization.yaml in the service directory
4. Add the service path to `flux/kustomization.yaml`
5. Commit with Conventional Commits format

### Commit Message Format
Follow Conventional Commits:
```
<type>(<scope>): <subject>

<body>
```
Types: feat, fix, docs, style, refactor, test, chore