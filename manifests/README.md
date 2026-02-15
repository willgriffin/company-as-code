# GitOps Manifests

This directory contains Kubernetes manifests for GitOps-based application deployments using Flux v2.

> **Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.

## Directory Structure

```
manifests/
├── clusters/              # Cluster-specific configurations
│   └── my-cluster/       # Default cluster configuration
│       ├── applications.yaml     # Application deployments
│       └── infrastructure.yaml   # Infrastructure components
├── applications/         # Application manifests
│   ├── nextcloud.yaml    # Cloud storage platform
│   ├── mattermost.yaml   # Team collaboration
│   ├── mailu.yaml        # Email server suite
│   └── kustomization.yaml
├── infrastructure/       # Infrastructure components
│   ├── external-secrets.yaml    # External Secrets Operator
│   ├── kong-gateway.yaml        # API Gateway
│   ├── cert-manager.yaml        # TLS certificate automation
│   ├── external-dns.yaml        # DNS automation
│   └── kustomization.yaml
└── users/               # User and identity management
    ├── admin-user.yaml
    ├── realm-config.yaml
    └── kustomization.yaml
```

## Infrastructure Components

### Kong Gateway
- Enterprise API gateway with Gateway API support
- OIDC authentication integration with Keycloak
- Advanced routing, rate limiting, and monitoring
- TLS termination and certificate management

### External Secrets Operator
- Dynamic secret injection from external stores
- GitHub repository secrets backend
- Automatic secret rotation support
- Kubernetes-native secret management

### cert-manager
- Automated TLS certificate provisioning with Let's Encrypt
- Certificate renewal automation
- Integration with Kong Gateway for TLS termination

### External DNS
- Automatic DNS record management with DigitalOcean
- Integration with Kong Gateway for service discovery
- Subdomain automation for applications

### Applications

#### Nextcloud
- Enterprise cloud storage platform
- DigitalOcean Spaces primary storage integration
- OIDC authentication with Keycloak
- High-availability PostgreSQL backend

#### Mattermost
- Team collaboration and messaging platform
- OIDC integration for single sign-on
- File storage and team management features

#### Keycloak
- Identity and access management platform
- Central SSO provider for all applications
- Operator-based deployment and management

#### Mailu
- Complete email server suite with webmail
- Anti-spam and antivirus protection
- OAuth2 proxy for OIDC authentication

## Flux Management

Flux is automatically bootstrapped and managed by CDKTF during cluster creation. No manual bootstrap is required.

**Key Features:**
- **Infrastructure as Code**: Flux lifecycle managed via CDKTF stacks
- **External Secrets Integration**: Dynamic secret injection configured automatically
- **GitOps Automation**: All manifests synced from Git repository

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

1. Create application directory under `manifests/clusters/my-cluster/`
2. Add Kubernetes manifests:
   - `namespace.yaml` - Application namespace
   - `deployment.yaml` - Application deployment
   - `service.yaml` - Service definition
   - `ingress.yaml` - Ingress rules (if needed)
   - `kustomization.yaml` - Kustomize configuration

3. Update `manifests/clusters/my-cluster/kustomization.yaml` to include new path

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

1. Create new cluster directory under `manifests/clusters/<cluster-name>/`
2. Copy the directory structure from `my-cluster/`
3. Add cluster-specific infrastructure components  
4. Update CDKTF configuration to bootstrap Flux for the new cluster path

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

This template uses **External Secrets Operator** for dynamic secret management:

```bash
# Check ExternalSecret status
kubectl get externalsecrets -A

# View secret synchronization
kubectl describe externalsecret <name> -n <namespace>

# Check secret stores
kubectl get secretstores -A
kubectl get clustersecretstores
```

**Key Features:**
- **Dynamic Injection**: Secrets fetched from external stores at runtime
- **GitHub Integration**: Repository secrets as external secret backend
- **Automatic Rotation**: Secrets refreshed periodically
- **No Secrets in Git**: Enhanced security with runtime secret fetching

See [docs/SECRETS.md](../docs/SECRETS.md) for detailed configuration.

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