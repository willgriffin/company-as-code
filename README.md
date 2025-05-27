# Infrastructure Monorepo

Genesis blueprint for happyvertical corporation. 

## Architecture

**Single cluster, single environment, maximum simplicity.**

- **Terraform**: Provisions DigitalOcean Kubernetes cluster and infrastructure
- **Flux**: GitOps for Kubernetes workloads
- **Git branches**: Testing and deployment workflow
- **Conventional Commits**: Standardized commit messages for automation

## Repository Structure

```
infrastructure-monorepo/
├── terraform/
│   ├── digitalocean/           # DO kubernetes cluster, networking, firewall
│   └── modules/                # Reusable terraform modules
├── flux/
│   ├── flux-system/           # Flux controllers and CRDs
│   ├── cert-manager/          # TLS certificate management
│   ├── ingress-nginx/         # Load balancer and ingress
│   ├── prometheus/            # Monitoring stack
│   ├── api-service/           # Example application
│   ├── email-server/          # Example service
│   └── kustomization.yaml     # Root manifest list
└── README.md
```

## Development Workflow

### Prerequisites

- Terraform >= 1.0
- kubectl
- flux CLI
- DigitalOcean account and API token
- Domain name for services
- GitHub account with repository access

### Initial Setup

1. **Configure GitHub repository secrets**
   
   Add these secrets to your GitHub repository (Settings → Secrets → Actions):
   - `DIGITALOCEAN_TOKEN` - Your DigitalOcean API token
   - `SPACES_ACCESS_KEY_ID` - DigitalOcean Spaces access key for Terraform state
   - `SPACES_SECRET_ACCESS_KEY` - DigitalOcean Spaces secret key for Terraform state
      ```
      gh secret set DIGITALOCEAN_TOKEN -b $DIGITALOCEAN_TOKEN --repo=happyvertical/blueprint
      gh secret set SPACES_ACCESS_KEY_ID -b $SPACES_ACCESS_KEY_ID --repo=happyvertical/blueprint
      gh secret set SPACES_SECRET_ACCESS_KEY -b $SPACES_SECRET_ACCESS_KEY --repo=happyvertical/blueprint
      ```

2. **Create DigitalOcean Space for Terraform state**
   ```bash
   # Create a Space named terraform-state-<your-org> in your preferred region
   # This will store Terraform state files remotely and securely
   ```

3. **Configure local secrets**
   ```bash
   cp terraform/digitalocean/terraform.tfvars.example terraform/digitalocean/terraform.tfvars
   # Edit with your cluster config and domain ONLY
   # DO NOT add tokens or credentials - these come from GitHub secrets or environment variables
   ```

4. **Deploy infrastructure**
   
   **Via GitHub Actions (recommended):**
   - Create a pull request with your configuration changes
   - Review the Terraform plan in the PR comments
   - Merge the PR to automatically apply changes
   
   **Via local command (initial setup only):**
   ```bash
   cd terraform/digitalocean
   terraform init
   terraform plan
   terraform apply
   ```

5. **Connect to cluster**
   ```bash
   # Get kubeconfig from terraform output
   terraform output kubeconfig > ~/.kube/config-do
   export KUBECONFIG=~/.kube/config-do
   kubectl cluster-info
   ```

6. **Bootstrap GitOps**
   ```bash
   # Install Flux on the cluster
   flux bootstrap github \
     --owner=<your-github-username> \
     --repository=infrastructure-monorepo \
     --branch=main \
     --path=flux \
     --personal
   ```

## Adding New Services

1. **Create service directory**
   ```bash
   mkdir flux/my-new-service
   ```

2. **Add Kubernetes manifests**
   ```bash
   # flux/my-new-service/deployment.yaml
   # flux/my-new-service/service.yaml
   # flux/my-new-service/kustomization.yaml
   ```

3. **Update root kustomization**
   ```yaml
   # flux/kustomization.yaml
   resources:
   - cert-manager/
   - ingress-nginx/
   - my-new-service/  # Add this line
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new service deployment"
   git push
   # Flux syncs automatically within 10 minutes
   ```

## Testing Changes

**Branch-based testing workflow:**

1. **Create feature branch**
   ```bash
   git checkout -b test-email-changes
   ```

2. **Make changes to manifests**
   ```bash
   # Edit flux/email-server/deployment.yaml
   git commit -am "test: update email server configuration"
   git push -u origin test-email-changes
   ```

3. **Test deployment options:**
   
   **Option A: Temporary branch sync**
   ```bash
   # Point Flux to test branch temporarily
   flux create source git infrastructure-test \
     --url=https://github.com/username/infrastructure-monorepo \
     --branch=test-email-changes
   ```
   
   **Option B: Second cluster**
   ```bash
   # Deploy test branch to staging cluster
   flux bootstrap git \
     --url=https://github.com/username/infrastructure-monorepo \
     --branch=test-email-changes \
     --path=flux
   ```

4. **Merge when ready**
   ```bash
   git checkout main
   git merge test-email-changes
   git push
   # Production automatically updates
   ```

## Cluster Configuration

**Global cluster settings** are defined in the root kustomization:

```yaml
# flux/kustomization.yaml
configMapGenerator:
- name: cluster-config
  literals:
  - rootDomain=example.com
  - environment=production
  - imageRegistry=registry.example.com

replacements:
- source:
    kind: ConfigMap
    name: cluster-config
    fieldPath: data.rootDomain
  targets:
  - select:
      kind: Ingress
    fieldPaths:
    - spec.rules.[name=*].host
```

**Services automatically inherit** these settings through kustomize replacements.

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

- **Single cluster**: Start simple, scale when needed
- **Flat structure**: No environment overlays until complexity demands it
- **Branch-based testing**: Git branches = deployment environments
- **Declarative everything**: Infrastructure and applications all in code
- **GitOps**: Git commits trigger deployments automatically
- **Conventional Commits**: Standardized messages enable automation and clear history

## Common Operations

**View cluster status:**
```bash
kubectl get pods -A
flux get kustomizations
```

**Force sync:**
```bash
flux reconcile kustomization flux-system
```

**Check Flux status:**
```bash
flux get sources git
flux get kustomizations
```

**View logs:**
```bash
kubectl logs -n flux-system deployment/source-controller
kubectl logs -n flux-system deployment/kustomize-controller
```

**Rollback:**
```bash
git revert <commit-hash>
git push
# Flux automatically rolls back
```

## Scaling Up

When you outgrow this simple setup:

1. **Add environment overlays** in app directories (`base/`, `dev/`, `prod/`)
2. **Split into platform/apps** directories for team ownership
3. **Multiple clusters** with cluster-specific configurations
4. **Advanced Flux features**: notifications, image automation, policy enforcement

But start simple and add complexity only when you need it.

## Getting Help

- **Terraform**: [DigitalOcean Provider Docs](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- **Flux**: [Flux Documentation](https://fluxcd.io/flux/)

## License

MIT