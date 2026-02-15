# Secret Management Guide

This guide covers the SOPS+age secret management approach used by the k3s multicloud GitOps platform. Secrets are encrypted at rest in the Git repository and decrypted by Flux at deploy time.

## Overview

The platform uses **SOPS** (Secrets OPerationS) with **age** encryption for GitOps-compatible secret management. This approach stores encrypted secrets directly in the Git repository alongside the manifests that reference them.

### Key Principles

- **Encrypted in Git**: Secrets are committed to the repository in encrypted form
- **Decrypted at deploy time**: Flux decrypts secrets during Kustomization reconciliation
- **Version controlled**: Secret changes are tracked in Git history with full auditability
- **No external dependencies**: No external secret store infrastructure is required
- **Single key management**: One age key pair per cluster controls all secret access

## How It Works

1. Secrets are encrypted locally using the age public key before committing to Git
2. The encrypted files are pushed to the repository like any other manifest
3. Flux watches the repository and pulls changes
4. When reconciling a Kustomization, Flux uses the age private key (stored as a Kubernetes secret) to decrypt SOPS-encrypted files
5. The decrypted Kubernetes Secret resources are applied to the cluster

```
Developer workstation          Git Repository              k3s Cluster

  secrets.yaml ──sops encrypt──> secrets.secret.enc.yaml ──Flux decrypt──> Kubernetes Secret
  (plaintext)                    (encrypted, committed)                    (runtime only)
```

## Setup

### 1. Generate an age Key Pair

```bash
age-keygen -o age.key
```

This outputs the public key to stdout and writes both keys to `age.key`. Example output:

```
# created: 2026-01-15T10:30:00Z
# public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
AGE-SECRET-KEY-1QFWEZC3AQEDRH4X8Y6TDNFXKWJMZ2P7HRSQV9CTLGFCE5VN7DLQS5DGXPN
```

Save the public key. Keep the `age.key` file secure -- it contains the private key needed for decryption.

### 2. Configure .sops.yaml

Create `.sops.yaml` in the repository root to tell SOPS which files to encrypt and which age public key to use:

```yaml
creation_rules:
  - path_regex: \.secret\.enc\.yaml$
    age: >-
      age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
```

This configuration encrypts any file matching the pattern `*.secret.enc.yaml` using the specified age public key.

### 3. Create the Kubernetes Secret for Flux

Load the age private key into the cluster so Flux can decrypt secrets during reconciliation:

```bash
kubectl create secret generic sops-age \
  --namespace=flux-system \
  --from-file=age.agekey=age.key
```

This creates a secret named `sops-age` in the `flux-system` namespace containing the private key.

### 4. Configure Flux Kustomizations for Decryption

Each Flux Kustomization that contains encrypted secrets must reference the decryption provider:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  path: ./manifests/apps
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
  decryption:
    provider: sops
    secretRef:
      name: sops-age
```

The `decryption` block tells Flux to use SOPS with the `sops-age` secret for decrypting any encrypted files found in the Kustomization path.

## Secret File Patterns

The repository uses two file patterns for secrets:

### Template Files: `*.secret.template.yaml`

Template files document the required secret structure without containing real values. They are committed to Git in plaintext and serve as documentation.

```yaml
# nextcloud.secret.template.yaml
# This file documents the required secret structure.
# Copy to nextcloud.secret.enc.yaml, fill in values, then encrypt with sops.
apiVersion: v1
kind: Secret
metadata:
  name: nextcloud-credentials
  namespace: nextcloud
type: Opaque
stringData:
  admin-username: "<NEXTCLOUD_ADMIN_USERNAME>"
  admin-password: "<NEXTCLOUD_ADMIN_PASSWORD>"
  oidc-client-secret: "<NEXTCLOUD_OIDC_CLIENT_SECRET>"
```

### Encrypted Files: `*.secret.enc.yaml`

Encrypted files contain real secret values encrypted with SOPS. They are committed to Git in encrypted form. Flux decrypts them at deploy time.

```yaml
# nextcloud.secret.enc.yaml (after sops encryption)
apiVersion: v1
kind: Secret
metadata:
  name: nextcloud-credentials
  namespace: nextcloud
type: Opaque
stringData:
  admin-username: ENC[AES256_GCM,data:...,type:str]
  admin-password: ENC[AES256_GCM,data:...,type:str]
  oidc-client-secret: ENC[AES256_GCM,data:...,type:str]
sops:
  age:
    - recipient: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
      enc: |
        -----BEGIN AGE ENCRYPTED FILE-----
        ...
        -----END AGE ENCRYPTED FILE-----
  lastmodified: "2026-01-15T10:35:00Z"
  version: 3.9.0
```

## Workflow: Creating New Secrets

### Step 1: Copy the Template

```bash
cp manifests/apps/myapp/secrets.secret.template.yaml \
   manifests/apps/myapp/secrets.secret.enc.yaml
```

### Step 2: Fill in Real Values

Edit the copied file and replace placeholder values with actual secrets:

```bash
$EDITOR manifests/apps/myapp/secrets.secret.enc.yaml
```

### Step 3: Encrypt the File

```bash
sops -e -i manifests/apps/myapp/secrets.secret.enc.yaml
```

The `-e` flag encrypts, and `-i` modifies the file in place. SOPS reads `.sops.yaml` to determine the encryption key.

### Step 4: Commit and Push

```bash
git add manifests/apps/myapp/secrets.secret.enc.yaml
git commit -m "Add encrypted secrets for myapp"
git push
```

Flux will detect the change, decrypt the file, and apply the Kubernetes Secret to the cluster.

## Workflow: Editing Existing Secrets

To edit an already-encrypted secret file:

```bash
# sops opens the file decrypted in your editor, then re-encrypts on save
sops manifests/apps/myapp/secrets.secret.enc.yaml
```

SOPS decrypts the file, opens it in your `$EDITOR`, and re-encrypts it when you save and close. You need the age private key available locally (via `SOPS_AGE_KEY_FILE` environment variable or the default location `~/.config/sops/age/keys.txt`).

```bash
# Set the key file location if not using the default
export SOPS_AGE_KEY_FILE=./age.key

# Edit the encrypted file
sops manifests/apps/myapp/secrets.secret.enc.yaml
```

After editing, commit and push the updated encrypted file.

## Workflow: Viewing Encrypted Secrets

To view the decrypted content without editing:

```bash
sops -d manifests/apps/myapp/secrets.secret.enc.yaml
```

## Key Rotation

To rotate the age key (for example, if the private key is compromised or during routine rotation):

### 1. Generate a New age Key Pair

```bash
age-keygen -o age-new.key
```

### 2. Update .sops.yaml

Add the new public key to `.sops.yaml`. During the transition period, include both old and new keys:

```yaml
creation_rules:
  - path_regex: \.secret\.enc\.yaml$
    age: >-
      age1oldkeyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx,
      age1newkeyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### 3. Re-encrypt All Secret Files

Use the `sops updatekeys` command to re-encrypt each file with the new key set:

```bash
# Find and re-encrypt all secret files
find manifests -name "*.secret.enc.yaml" -exec sops updatekeys -y {} \;
```

### 4. Update the Cluster Secret

```bash
kubectl delete secret sops-age -n flux-system
kubectl create secret generic sops-age \
  --namespace=flux-system \
  --from-file=age.agekey=age-new.key
```

### 5. Remove the Old Key

Once all files are re-encrypted and the cluster secret is updated, remove the old key from `.sops.yaml`:

```yaml
creation_rules:
  - path_regex: \.secret\.enc\.yaml$
    age: >-
      age1newkeyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### 6. Commit and Force Reconciliation

```bash
git add .sops.yaml manifests/
git commit -m "Rotate age encryption key"
git push

flux reconcile source git flux-system
```

## Flux Integration

### Kustomization Decryption Configuration

Every Flux Kustomization that contains encrypted secrets must include the decryption block:

```yaml
spec:
  decryption:
    provider: sops
    secretRef:
      name: sops-age
```

This tells the Flux Kustomize controller to:
1. Scan for SOPS-encrypted files in the Kustomization path
2. Decrypt them using the age private key from the `sops-age` secret
3. Apply the decrypted Kubernetes resources to the cluster

### Verifying Decryption

Check that Flux is successfully decrypting secrets:

```bash
# Check Kustomization status for decryption errors
flux get kustomizations

# Look for decryption-related events
flux events --all-namespaces | grep -i decrypt

# Verify the resulting Kubernetes secrets exist
kubectl get secrets -n <namespace>
```

If decryption fails, the Kustomization will report an error. Common causes:
- Missing `sops-age` secret in `flux-system` namespace
- age key mismatch (private key does not correspond to the public key used for encryption)
- Malformed `.sops.yaml` configuration

## Security Best Practices

### Private Key Protection

- **Never commit the age private key** (`age.key`) to the Git repository
- Store the private key in a secure location outside the repository (password manager, hardware security module, or encrypted backup)
- The private key should only exist in two places: the cluster (as the `sops-age` secret) and your secure backup
- Add `age.key` to `.gitignore`

### Access Control

- Limit who has access to the age private key
- Anyone with the private key can decrypt all secrets in the repository
- Use Kubernetes RBAC to restrict access to the `sops-age` secret in the `flux-system` namespace

### Encryption Scope

- SOPS encrypts only the `data` and `stringData` values in Kubernetes Secret manifests
- Metadata (name, namespace, labels) remains in plaintext for GitOps tooling compatibility
- This means secret names and namespaces are visible in the repository, but values are encrypted

### Repository Configuration

Ensure `.gitignore` excludes the private key and any unencrypted secret files:

```gitignore
# age private keys
age.key
*.agekey

# Unencrypted secrets (should never be committed)
*.secret.yaml
!*.secret.template.yaml
!*.secret.enc.yaml
```

### Audit Trail

Since secrets are committed to Git, all changes are tracked:
- Who changed a secret (Git author)
- When the secret was changed (Git timestamp)
- What changed (Git diff shows encrypted content changes, though not plaintext values)
- Why it was changed (Git commit message)

## Troubleshooting

### SOPS Cannot Encrypt

```bash
# Error: no matching creation_rule found
# Ensure the filename matches the pattern in .sops.yaml
# Files must end in .secret.enc.yaml

# Error: failed to get the data key
# Verify the age public key in .sops.yaml is correct
```

### SOPS Cannot Decrypt

```bash
# Error: no age identity found
# Set the key file location:
export SOPS_AGE_KEY_FILE=./age.key

# Or place the key in the default location:
mkdir -p ~/.config/sops/age
cp age.key ~/.config/sops/age/keys.txt
```

### Flux Decryption Failures

```bash
# Check if the sops-age secret exists
kubectl get secret sops-age -n flux-system

# Verify the secret contains the key
kubectl get secret sops-age -n flux-system -o jsonpath='{.data}' | base64 -d

# Check Kustomization status for errors
flux get kustomization <name>

# View detailed Kustomization events
kubectl describe kustomization -n flux-system <name>
```

### Secret Not Appearing in Cluster

```bash
# Check if the Kustomization has the decryption block
kubectl get kustomization -n flux-system <name> -o yaml | grep -A3 decryption

# Force a reconciliation
flux reconcile kustomization <name>

# Check for SOPS metadata in the encrypted file
head -50 manifests/apps/myapp/secrets.secret.enc.yaml
# Should contain a "sops:" block at the end of the file
```
