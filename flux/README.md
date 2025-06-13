# Flux GitOps Configuration

This directory contains Flux CD configurations for GitOps-based Kubernetes deployments.

> **Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.

## Directory Structure

```
flux/
├── clusters/              # Cluster-specific configurations
│   └── cumulus/          # Cumulus cluster (DigitalOcean)
│       ├── core/         # Core infrastructure components
│       ├── controllers/  # Kubernetes operators and controllers
│       ├── services/     # Platform services
│       │   ├── cert-manager/     # TLS certificate automation
│       │   ├── ingress-nginx/    # Ingress controller
│       │   └── keycloak/         # Identity and access management
│       └── kustomization.yaml    # Cluster root kustomization
└── base/                 # Base configurations (future)
```

## Cluster: Cumulus (DigitalOcean)

The cumulus cluster hosts the core infrastructure services required for application deployment on DigitalOcean.

### Infrastructure Components

#### cert-manager
- Automated TLS certificate provisioning
- Let's Encrypt integration
- Certificate renewal automation

#### ingress-nginx
- Layer 7 load balancing
- SSL/TLS termination
- Path-based routing

#### Keycloak
- Single Sign-On (SSO) provider
- OAuth2/OIDC authentication
- Hosted at: `auth.happyvertical.com`
- User federation and identity brokering

## Flux Management

Flux is automatically bootstrapped and managed by the Terraform provider during cluster creation. No manual bootstrap is required.

**Key Features:**
- **Infrastructure as Code**: Flux lifecycle managed via Terraform
- **SOPS Integration**: Automatic secret decryption configured via Terraform  
- **Declarative Configuration**: All Flux settings defined in `terraform/digitalocean/flux.tf`

**Manual Operations:**
```bash
# Check Flux status
flux get all -n flux-system

# Force reconciliation
flux reconcile kustomization flux-system -n flux-system

# View Flux configuration (managed by Terraform)
kubectl get gitrepository,kustomizations -n flux-system
```

## Adding New Applications

### To the Cumulus Cluster

1. Create application directory under `flux/clusters/my-cluster/`
2. Add Kubernetes manifests:
   - `namespace.yaml` - Application namespace
   - `deployment.yaml` - Application deployment
   - `service.yaml` - Service definition
   - `ingress.yaml` - Ingress rules (if needed)
   - `kustomization.yaml` - Kustomize configuration

3. Update `flux/clusters/my-cluster/kustomization.yaml` to include new path

Example structure:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - ingress.yaml
```

### Adding a New Cluster

1. Create new cluster directory under `flux/clusters/<cluster-name>/`
2. Copy the directory structure from `cumulus/`
3. Add cluster-specific infrastructure components
4. Update Terraform configuration to bootstrap Flux for the new cluster path

## Flux Commands

```bash
# Check reconciliation status
flux get all -n flux-system

# Force reconciliation
flux reconcile source git flux-system

# Check specific kustomization
flux get kustomization -A

# View logs
flux logs -n flux-system

# Suspend reconciliation
flux suspend kustomization <name>

# Resume reconciliation
flux resume kustomization <name>
```

## Secret Management

Secrets should be created directly in the cluster:

```bash
# Create generic secret
kubectl create secret generic <secret-name> \
  --from-literal=key=value \
  -n <namespace>

# Create docker registry secret
kubectl create secret docker-registry <secret-name> \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n <namespace>
```

For production, consider using:
- Sealed Secrets
- SOPS with Flux
- External Secrets Operator

## Monitoring Deployments

```bash
# Watch Flux kustomizations
watch flux get kustomizations -A

# Check pod status
kubectl get pods -A

# View recent events
kubectl get events -A --sort-by='.lastTimestamp'
```

## Troubleshooting

### Common Issues

1. **Reconciliation Failures**
   ```bash
   flux get sources git -A
   flux logs -n flux-system --tail=100
   ```

2. **Image Pull Errors**
   - Verify image exists and is accessible
   - Check imagePullSecrets in deployment

3. **Ingress Not Working**
   - Verify ingress-nginx is running
   - Check ingress annotations
   - Verify DNS records

### Debug Commands

```bash
# Describe flux resources
kubectl describe kustomization -n flux-system <name>

# Check git repository status
kubectl describe gitrepository -n flux-system flux-system

# View deployment details
kubectl describe deployment -n <namespace> <deployment>
```