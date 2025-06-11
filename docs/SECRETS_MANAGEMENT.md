# Secrets Management

This document describes how secrets are managed in the Blueprint infrastructure using SOPS (Secrets OPerationS) for encryption and GitHub Actions for templating.

> **Note for Template Users**: This template does not include any encrypted secrets (`.enc.yaml` files). These are generated during your initial deployment with your own encryption keys. The template only provides secret templates that define the structure.

## Overview

The secrets management system uses:
- **GitHub Secrets**: Store raw secret values securely
- **Secret Templates**: Define the structure of Kubernetes secrets
- **GitHub Actions**: Process templates and encrypt secrets
- **SOPS with age**: Encrypt secrets at rest in Git
- **Flux**: Decrypt and apply secrets to the cluster

## Architecture

```
GitHub Secrets → Templates → GitHub Actions → SOPS Encryption → Git → Flux → Kubernetes
```

## Initial Setup

> **Important**: When using this template, encrypted secret files (`.enc.yaml`) are automatically generated during the deployment process. You don't need to create them manually.

### 1. Generate age Key Pair

The initial setup script will generate this for you, but you can also do it manually:

```bash
# Run the initial setup script (recommended)
./scripts/initial-setup

# Or generate manually:
age-keygen -o age.key

# The output will show:
# Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
# Save the private key securely!
```

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**Infrastructure Secrets:**
- `SOPS_AGE_PRIVATE_KEY`: The age private key for SOPS encryption
- `SOPS_AGE_PUBLIC_KEY`: The age public key (for reference)

**Application Secrets:**
For each application, create secrets following the pattern `<APP>_<ENV>_<SECRET>`:

- Keycloak:
  - `KEYCLOAK_PROD_DB_PASSWORD`
  - `KEYCLOAK_PROD_ADMIN_PASSWORD`

- Mattermost:
  - `MATTERMOST_PROD_DB_PASSWORD`
  - `MATTERMOST_PROD_OAUTH_CLIENT_ID`
  - `MATTERMOST_PROD_OAUTH_CLIENT_SECRET`

- Nextcloud:
  - `NEXTCLOUD_PROD_DB_PASSWORD`
  - `NEXTCLOUD_PROD_ADMIN_PASSWORD`
  - `NEXTCLOUD_PROD_OIDC_CLIENT_ID`
  - `NEXTCLOUD_PROD_OIDC_CLIENT_SECRET`
  - `NEXTCLOUD_PROD_SPACES_ACCESS_KEY`
  - `NEXTCLOUD_PROD_SPACES_SECRET_KEY`

- Mailu:
  - `MAILU_PROD_OAUTH2_CLIENT_ID`
  - `MAILU_PROD_OAUTH2_CLIENT_SECRET`
  - `MAILU_PROD_OAUTH2_COOKIE_SECRET`

### 3. Deploy SOPS Key to Cluster

```bash
# Create the SOPS age secret in the cluster
kubectl create secret generic sops-age \
  --from-file=age.key=age.key \
  -n flux-system

# Verify the secret was created
kubectl get secret sops-age -n flux-system
```

### 4. Update .sops.yaml

The `.sops.yaml` file is already configured with the age public key. If you generated a new key, update it:

```yaml
creation_rules:
  - path_regex: flux/.*secret.*\.ya?ml$
    encrypted_regex: ^(data|stringData)$
    age: <YOUR_AGE_PUBLIC_KEY>
```

## Usage

### Processing Secrets with GitHub Actions

The secrets management workflow can be triggered:

1. **Manually via GitHub UI:**
   - Go to Actions → Secrets Management
   - Click "Run workflow"
   - Select the application and environment
   - Click "Run workflow"

2. **Automatically on push:**
   - Any changes to secret templates or the workflow itself

### Adding a New Application

1. **Create a secret template:**
   ```bash
   # Create template file in the application's directory
   vi flux/clusters/cumulus/<app>/secrets-template.yaml
   ```

   Example template:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: <app>-config
     namespace: <app>
   type: Opaque
   stringData:
     key1: "{{ .Env.<APP>_SECRET_KEY1 }}"
     key2: "{{ .Env.<APP>_SECRET_KEY2 }}"
   ```

2. **Add GitHub Secrets:**
   - Add the required secrets to GitHub repository settings
   - Follow the naming convention: `<APP>_<ENV>_<SECRET>`

3. **Update the workflow:**
   - Add a new processing step in `.github/workflows/secrets-management.yml`
   - Include the new app in the workflow choices

4. **Update kustomization:**
   - Add `secrets.enc.yaml` to the app's kustomization.yaml

5. **Run the workflow:**
   - Trigger the workflow to generate encrypted secrets

### Updating Secrets

1. **Update GitHub Secret:**
   - Go to repository Settings → Secrets
   - Update the secret value

2. **Run the workflow:**
   - Trigger the secrets management workflow
   - Select the affected application

3. **Verify deployment:**
   ```bash
   # Check Flux sync status
   flux get kustomization <app>
   
   # Verify secret in cluster
   kubectl get secret -n <app>
   ```

## Local Development

### Decrypting Secrets Locally

```bash
# Install SOPS and age
brew install sops age

# Export your age key
export SOPS_AGE_KEY_FILE=path/to/age.key

# Decrypt a secret file
sops -d flux/clusters/cumulus/<app>/secrets.enc.yaml

# Edit an encrypted file (opens in editor)
sops flux/clusters/cumulus/<app>/secrets.enc.yaml
```

### Testing Templates Locally

```bash
# Install gomplate
brew install gomplate

# Set environment variables
export KEYCLOAK_DB_PASSWORD="test-password"
export KEYCLOAK_ADMIN_PASSWORD="test-admin"

# Test template rendering
gomplate -f flux/clusters/cumulus/keycloak/secrets-template.yaml
```

## Security Best Practices

1. **Never commit unencrypted secrets** to Git
2. **Rotate secrets regularly** - Update GitHub Secrets and run the workflow
3. **Limit access** to GitHub Secrets to authorized personnel only
4. **Use strong passwords** - Generate with `openssl rand -base64 32`
5. **Backup age keys** securely - Store in a password manager or secure vault
6. **Monitor access** - Review GitHub audit logs regularly

## Troubleshooting

### SOPS Decryption Fails in Flux

```bash
# Check if SOPS key is present
kubectl get secret sops-age -n flux-system

# Check Flux controller logs
kubectl logs -n flux-system deployment/kustomize-controller

# Verify SOPS can decrypt locally
sops -d flux/clusters/cumulus/<app>/secrets.enc.yaml
```

### GitHub Actions Workflow Fails

1. Check if all required GitHub Secrets are set
2. Verify the age public key in `.sops.yaml` matches your key
3. Check workflow logs for specific error messages

### Secret Not Updating in Cluster

```bash
# Force Flux reconciliation
flux reconcile kustomization flux-system --with-source

# Check secret contents (be careful - contains sensitive data!)
kubectl get secret <secret-name> -n <namespace> -o yaml
```

## Migration from Plain Secrets

To migrate existing plain secrets to SOPS-encrypted secrets:

1. Extract current secret values from the cluster
2. Add values to GitHub Secrets
3. Remove plain secret files from Git
4. Run the secrets management workflow
5. Verify encrypted secrets are applied

## References

- [SOPS Documentation](https://github.com/getsops/sops)
- [age Encryption](https://github.com/FiloSottile/age)
- [Flux SOPS Integration](https://fluxcd.io/flux/guides/mozilla-sops/)
- [Gomplate Documentation](https://docs.gomplate.ca/)