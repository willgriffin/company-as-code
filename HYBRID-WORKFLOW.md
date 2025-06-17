# Hybrid Configuration Workflow

This document describes the hybrid configuration approach implemented for the GitOps template, combining one-time static configuration with dynamic infrastructure-dependent settings.

## Overview

The hybrid approach addresses the challenge of balancing automation with GitOps principles by separating:

1. **Static Configuration** - One-time replacements for domains, cluster names, etc.
2. **Dynamic Configuration** - Infrastructure-dependent values that change with cluster size/configuration

## Architecture

### Static Configuration (One-Time)
Handled during CDKTF deployment via the `FluxConfigurationStack`:
- Domain names (`example.com` → `yourdomain.com`)
- Cluster names (`my-cluster` → `yourproject-production`)
- Application hostnames (`chat.example.com` → `chat.yourdomain.com`)
- Email addresses and project identifiers

### Dynamic Configuration (Ongoing)
Provided via Kubernetes ConfigMap that Flux manifests reference:
- Resource profiles (CPU/memory sizing based on cluster configuration)
- Storage classes and sizes
- Node selectors and networking configuration
- Application-specific overrides

## Implementation Details

### 1. CDKTF FluxConfigurationStack

The `FluxConfigurationStack` in `/platform/src/stacks/flux-configuration.ts`:

- **One-time manifest replacement**: Uses Terraform `null_resource` with `local-exec` to perform sed replacements on Flux YAML files
- **Infrastructure ConfigMap creation**: Generates a ConfigMap in the `flux-system` namespace with dynamic values
- **Backup mechanism**: Creates `.backups` directory with original files before modification

### 2. Infrastructure ConfigMap Structure

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: infrastructure-config
  namespace: flux-system
data:
  values.yaml: |
    resourceProfiles:
      small:
        requests: { cpu: "500m", memory: "512Mi" }
        limits: { cpu: "500m", memory: "512Mi" }
      medium:
        requests: { cpu: "1000m", memory: "1Gi" }
        limits: { cpu: "1000m", memory: "1Gi" }
      large:
        requests: { cpu: "2000m", memory: "2Gi" }
        limits: { cpu: "2000m", memory: "2Gi" }
    
    storage:
      fast: { storageClass: "do-block-storage", size: "10Gi" }
      bulk: { storageClass: "do-block-storage", size: "100Gi" }
    
    cluster:
      region: "nyc3"
      domain: "yourdomain.com"
      nodeCount: 3
      haControlPlane: true
```

### 3. Flux Manifest Variable Substitution

Applications use Flux's native `valuesFrom` to reference the ConfigMap:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: mattermost-team-edition
  namespace: mattermost
spec:
  valuesFrom:
    - kind: ConfigMap
      name: infrastructure-config
      valuesKey: values.yaml
      targetPath: infraConfig
  values:
    # Static values (replaced once)
    config:
      SiteURL: "https://chat.yourdomain.com"
    
    # Dynamic values (from ConfigMap)
    resources: "${infraConfig.resourceProfiles.medium}"
    persistence:
      data:
        size: "${infraConfig.storage.bulk.size}"
        storageClass: "${infraConfig.storage.bulk.storageClass}"
```

## New Deployment Workflow

### Prerequisites Setup (Optional)
```bash
# 1. Create configuration
cp infrastructure.config.json.example infrastructure.config.json
# Edit with your settings

# 2. Run prerequisites (creates secrets, state bucket, etc.)
./setup.sh
```

### Infrastructure Deployment
```bash
# 3. Deploy infrastructure with CDKTF
cd platform
npm run deploy

# This automatically:
# - Creates DigitalOcean cluster and supporting infrastructure
# - Performs one-time static manifest configuration
# - Creates infrastructure ConfigMap with dynamic values
# - Sets up GitHub secrets and integrations
```

### Post-Deployment
```bash
# 4. Access applications
# Applications are available at configured domains after Flux deployment completes
```

## Benefits

### 1. **Preserves GitOps Principles**
- Git remains source of truth for application configuration
- All changes tracked in version control
- Standard Flux reconciliation loops

### 2. **Balances Automation with Flexibility**
- One-time setup removes manual configuration steps
- Dynamic values adapt to infrastructure changes
- Users can override any setting by editing manifests directly

### 3. **Simplifies Maintenance**
- No complex external templating systems
- Uses Flux's native variable substitution
- Infrastructure changes automatically propagate to applications

### 4. **Enables Evolution**
- Template users can customize and extend configurations
- No coupling between infrastructure and application configuration
- Clear separation of concerns

## Configuration Examples

### Resource Scaling
When you change cluster node size from `s-2vcpu-4gb` to `s-4vcpu-8gb`, the ConfigMap automatically:
- Adjusts memory limits in resource profiles
- Updates storage sizes proportionally
- Modifies networking configuration if needed

### Multi-Environment Support
Different environments can have different resource profiles:
- **Staging**: Uses `small` resource profiles
- **Production**: Uses `large` resource profiles with HA settings

### Application Overrides
Each application has sensible defaults but can be customized:
```yaml
applications:
  nextcloud:
    profile: "large"    # High resource usage
    storage: "bulk"     # Large storage needs
  mattermost:
    profile: "medium"   # Moderate resource usage
    storage: "fast"     # Performance-focused storage
```

## Migration from Previous Setup

The hybrid approach replaces the original `initial-setup.sh` script's template replacement functionality while maintaining compatibility:

1. **Static replacements** happen automatically during CDKTF deployment
2. **Dynamic values** are provided via ConfigMap instead of sed replacements
3. **User customizations** are preserved and can be made directly to manifests

## Troubleshooting

### ConfigMap Not Found
If applications show ConfigMap errors:
```bash
# Check if ConfigMap exists
kubectl get configmap infrastructure-config -n flux-system

# View ConfigMap contents
kubectl get configmap infrastructure-config -n flux-system -o yaml
```

### Static Configuration Issues
If domains or cluster names aren't updated:
```bash
# Check backup files
ls flux/.backups/

# Re-run CDKTF deployment to retry configuration
cd platform && npm run deploy
```

### Variable Substitution Not Working
Verify Flux variable syntax:
- Use `"${infraConfig.path.to.value}"` (with quotes)
- Ensure `valuesFrom` references correct ConfigMap name and namespace
- Check Flux controller logs for substitution errors

## Advanced Usage

### Custom Resource Profiles
Add new profiles to the ConfigMap generation code:
```typescript
// In flux-configuration.ts
const customProfiles = {
  gpu: { cpu: '4000m', memory: '8Gi', 'nvidia.com/gpu': 1 },
  compute: { cpu: '8000m', memory: '16Gi' }
};
```

### Environment-Specific Overrides
Use Kustomize overlays for environment-specific customizations:
```yaml
# kustomization.yaml
patchesStrategicMerge:
  - production-overrides.yaml
```

This hybrid approach provides the best of both worlds: automated setup for common configurations and flexible GitOps workflows for ongoing management.