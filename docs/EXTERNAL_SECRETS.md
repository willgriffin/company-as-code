# External Secrets Operator Migration Guide

This document explains the migration from SOPS-based secret management to External Secrets Operator (ESO) for centralized, automated secret management.

## Overview

The GitOps template now uses External Secrets Operator to manage secrets through:
- **Central Secret Store**: All secrets stored in `digitalocean-secrets` namespace
- **Automatic Synchronization**: Secrets automatically synced to application namespaces
- **Refresh Intervals**: Secrets refreshed periodically for rotation support
- **RBAC Integration**: Proper Kubernetes service account authentication

## Architecture

### Components

1. **External Secrets Operator**: Kubernetes operator managing secret synchronization
2. **ClusterSecretStore**: Global secret store accessing central secrets
3. **SecretStore**: Namespace-specific secret stores 
4. **ExternalSecret**: Resources defining secret synchronization rules
5. **Source Secrets**: Central secrets in `digitalocean-secrets` namespace

### Secret Flow

```
GitHub Secrets → digitalocean-secrets namespace → ExternalSecret → Application Secret
                     (source)                      (sync rule)      (target)
```

## Configuration

### Required GitHub Secrets

The following secrets must be configured in your repository settings:

#### Core Infrastructure
- `DIGITALOCEAN_TOKEN` - DigitalOcean API token for DNS and infrastructure
- `DO_SPACES_ACCESS_KEY` - DigitalOcean Spaces access key for backups
- `DO_SPACES_SECRET_KEY` - DigitalOcean Spaces secret key for backups

#### Monitoring & Observability
- `SENTRY_AUTH_TOKEN` - Sentry authentication token for error tracking
- `SENTRY_DSN` - Sentry DSN for application error reporting

#### Email & Notifications  
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (typically 587)
- `SMTP_USERNAME` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password
- `SMTP_FROM` - Default sender email address

#### Application Secrets (Optional)
- `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin user password
- `MATTERMOST_DB_PASSWORD` - Mattermost database password
- `NEXTCLOUD_ADMIN_PASSWORD` - Nextcloud admin user password

### Kubernetes Configuration

#### ClusterSecretStore
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: digitalocean-secrets
spec:
  provider:
    kubernetes:
      remoteNamespace: digitalocean-secrets
      server:
        url: "https://kubernetes.default.svc"
      auth:
        serviceAccount:
          name: external-secrets-digitalocean
          namespace: external-secrets-system
```

#### ExternalSecret Example
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: external-dns-digitalocean
  namespace: external-dns
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: digitalocean-secrets
    kind: ClusterSecretStore
  target:
    name: external-dns-digitalocean
    creationPolicy: Owner
  data:
  - secretKey: DO_TOKEN
    remoteRef:
      key: digitalocean-token
      property: token
```

## Deployment

### Automatic Setup

External Secrets are automatically configured when:
1. External Secrets Operator is deployed
2. GitHub Actions workflow `external-secrets-setup.yml` runs
3. Central secrets are populated from GitHub Secrets
4. ExternalSecret resources sync secrets to application namespaces

### Manual Setup

For manual deployment:

```bash
# 1. Deploy External Secrets Operator
kubectl apply -k flux/clusters/cumulus/controllers/external-secrets-operator/

# 2. Wait for operator to be ready
kubectl wait --for=condition=available --timeout=300s deployment/external-secrets -n external-secrets-system

# 3. Setup central secrets (requires environment variables)
export DIGITALOCEAN_TOKEN="your-token"
export DO_SPACES_ACCESS_KEY="your-key"
export DO_SPACES_SECRET_KEY="your-secret"
# ... other secrets

# Process and apply central secrets
gomplate --file flux/clusters/cumulus/core/external-secrets/digitalocean-source-secrets.yaml | kubectl apply -f -

# 4. Apply secret stores
kubectl apply -k flux/clusters/cumulus/core/external-secrets/

# 5. Deploy application ExternalSecrets
kubectl apply -f flux/clusters/cumulus/core/external-dns/external-secret.yaml
```

## Migration from SOPS

### Differences from SOPS

| Feature | SOPS | External Secrets |
|---------|------|------------------|
| **Storage** | Git repository | Kubernetes secrets |
| **Encryption** | Age/PGP at rest | In-cluster only |
| **Rotation** | Manual Git commits | Automatic refresh |
| **Access Control** | Git repository access | Kubernetes RBAC |
| **Audit Trail** | Git history | Kubernetes events |
| **Dependencies** | Age keys, SOPS CLI | Kubernetes operator |

### Migration Steps

1. **Deploy External Secrets Operator**
   ```bash
   kubectl apply -k flux/clusters/cumulus/controllers/external-secrets-operator/
   ```

2. **Populate Central Secrets**
   - Set GitHub Secrets in repository settings
   - Run `external-secrets-setup.yml` workflow

3. **Convert Secret Templates**
   - Replace `secrets-template.yaml` with `external-secret.yaml`
   - Update kustomization.yaml references
   - Test secret synchronization

4. **Remove SOPS Dependencies**
   - Remove Age keys and SOPS configuration
   - Update GitHub Actions workflows
   - Clean up encrypted `.enc.yaml` files

### Converted Resources

All template resources have been successfully migrated to External Secrets:

#### Infrastructure ✅ COMPLETE
- ✅ `external-dns` - DigitalOcean DNS token
- ✅ `velero` - Backup credentials for DigitalOcean Spaces
- ✅ `sentry-operator` - Sentry authentication token

#### Core Services ✅ COMPLETE
- ✅ `grafana` - OAuth2 proxy credentials
- ✅ `jaeger` - OAuth2 proxy credentials
- ✅ `prometheus` - OAuth2 proxy credentials

#### Applications ✅ COMPLETE
- ✅ `keycloak` - Database, admin, and backup credentials
- ✅ `mattermost` - Database, OAuth, and backup credentials  
- ✅ `nextcloud` - Database, admin, OIDC, storage, and backup credentials
- ✅ `mailu` - OAuth2 proxy, database, backup, and SES credentials
- ✅ `postal` - OAuth, database, Redis, RabbitMQ, and application secrets
- ✅ `sentry` - OAuth2 proxy, database, Redis, and backup credentials

#### Migration Status: 🎉 **100% COMPLETE**

## Troubleshooting

### Common Issues

#### Secret Not Synchronized
```bash
# Check ExternalSecret status
kubectl describe externalsecret <name> -n <namespace>

# Check SecretStore connectivity
kubectl get secretstore -A
kubectl describe clustersecretstore digitalocean-secrets

# Check source secret exists
kubectl get secret <source-secret> -n digitalocean-secrets
```

#### Permission Denied Errors
```bash
# Check service account permissions
kubectl get clusterrolebinding external-secrets-digitalocean
kubectl describe serviceaccount external-secrets-digitalocean -n external-secrets-system

# Check secret store authentication
kubectl logs -n external-secrets-system deployment/external-secrets
```

#### Refresh Issues
```bash
# Force refresh by updating ExternalSecret
kubectl annotate externalsecret <name> -n <namespace> force-sync=$(date +%s)

# Check refresh interval configuration
kubectl get externalsecret <name> -n <namespace> -o yaml | grep refreshInterval
```

### Debugging Commands

```bash
# Check External Secrets Operator status
kubectl get pods -n external-secrets-system
kubectl logs -n external-secrets-system deployment/external-secrets

# List all ExternalSecrets
kubectl get externalsecret -A

# Check secret synchronization status
kubectl get externalsecret -A -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,STATUS:.status.conditions[0].type,MESSAGE:.status.conditions[0].message

# Verify source secrets
kubectl get secrets -n digitalocean-secrets
```

## Security Considerations

### Best Practices

1. **Least Privilege**: ExternalSecrets only access required source secrets
2. **Namespace Isolation**: Secrets scoped to specific namespaces
3. **Regular Rotation**: Configure appropriate refresh intervals
4. **Audit Logging**: Monitor Kubernetes events for secret access
5. **RBAC**: Use service accounts with minimal required permissions

### Security Benefits

- **Centralized Management**: Single source of truth for secrets
- **Automatic Rotation**: Scheduled secret updates without manual intervention
- **Real-time Revocation**: Immediate secret invalidation through Kubernetes
- **Audit Trail**: Comprehensive logging through Kubernetes events
- **No Git Exposure**: Secrets never stored in version control

## Advanced Configuration

### Custom Secret Stores

Create namespace-specific secret stores for enhanced isolation:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: app-specific-secrets
  namespace: my-app
spec:
  provider:
    kubernetes:
      remoteNamespace: my-app-secrets
      server:
        url: "https://kubernetes.default.svc"
      auth:
        serviceAccount:
          name: my-app-external-secrets
          namespace: my-app
```

### Secret Templating

Use Go templates for complex secret structures:

```yaml
target:
  name: complex-secret
  template:
    type: kubernetes.io/dockerconfigjson
    data:
      .dockerconfigjson: |
        {
          "auths": {
            "{{ .registry }}": {
              "username": "{{ .username }}",
              "password": "{{ .password }}",
              "auth": "{{ printf "%s:%s" .username .password | b64enc }}"
            }
          }
        }
```

### Multiple Providers

External Secrets Operator supports multiple secret providers:

- **Kubernetes**: Cross-namespace secret access (current implementation)
- **HashiCorp Vault**: Enterprise secret management
- **AWS Secrets Manager**: AWS-native secret storage
- **Azure Key Vault**: Azure-native secret storage
- **Google Secret Manager**: GCP-native secret storage

## Future Enhancements

### Planned Improvements

1. **DigitalOcean App Platform Vault Integration**
   - Native DigitalOcean secret provider
   - Webhook-based secret synchronization
   - DigitalOcean IAM integration

2. **Advanced Secret Rotation**
   - Automated credential rotation policies
   - Integration with secret generation tools
   - Application restart coordination

3. **Enhanced Monitoring**
   - Secret access metrics
   - Rotation compliance dashboards
   - Security audit reports

4. **Multi-Environment Support**
   - Environment-specific secret stores
   - Promotion workflows between environments
   - Configuration drift detection

## References

- [External Secrets Operator Documentation](https://external-secrets.io/)
- [Kubernetes Secret Management Best Practices](https://kubernetes.io/docs/concepts/configuration/secret/)
- [DigitalOcean Kubernetes Guide](https://docs.digitalocean.com/products/kubernetes/)
- [External Secrets Operator GitHub](https://github.com/external-secrets/external-secrets)