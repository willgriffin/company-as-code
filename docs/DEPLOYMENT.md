# Deployment Guide

This guide walks through the complete deployment process for the k3s multicloud GitOps platform, from initial setup through production deployment.

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | CDKTF and setup scripts |
| bun | Latest | Package manager and script runner |
| age | Latest | Secret encryption key generation |
| sops | Latest | Secret file encryption/decryption |
| flux | 2.x | Flux CLI for GitOps management |
| kubectl | 1.31+ | Kubernetes CLI |
| git | Any recent | Version control |

```bash
# Verify installations
node --version      # Should be 22.0.0 or higher
bun --version       # Install from https://bun.sh
age --version       # Install: brew install age
sops --version      # Install: brew install sops
flux --version      # Install: brew install fluxcd/tap/flux
kubectl version     # Install: brew install kubectl
git --version
```

### Required Accounts

- **Cloud provider account**: Hetzner Cloud or DigitalOcean with API token
- **AWS account**: For S3 Terraform state storage and Route53 DNS
- **GitHub account**: With personal access token (repo and workflow scopes)
- **Domain name**: Configured with AWS Route53 for DNS management

### Required Permissions

- **Hetzner/DigitalOcean**: Full access to servers, firewalls, and SSH keys
- **AWS**: S3 full access, Route53 zone management, IAM user creation
- **GitHub**: Repository admin access for secrets and workflow management

## Deployment Process

### Phase 1: Repository Setup

#### 1. Create Repository from Template

1. Navigate to the template repository on GitHub
2. Click **"Use this template"**
3. Choose repository name and visibility settings
4. Clone your new repository:

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

#### 2. Install Dependencies

```bash
# Install project dependencies
bun install

# Install platform dependencies
cd platform
bun install
cd ..
```

### Phase 2: Infrastructure Provisioning with CDKTF

CDKTF provisions the VPS nodes, DNS zones, and state storage on the target cloud provider.

#### 1. Configure the Platform

Edit `platform/config.json` or run the setup script to generate it:

```bash
./setup.ts
```

The configuration specifies your cloud provider, region, node sizing, domain, and other settings.

#### 2. Deploy Infrastructure

```bash
cd platform

# Install CDKTF providers (first time only)
bun run cdktf get

# Review planned changes
bun run cdktf plan

# Deploy infrastructure
bun run cdktf deploy
```

This creates:
- VPS nodes on Hetzner Cloud or DigitalOcean
- AWS S3 bucket for Terraform state (if not already created)
- Route53 DNS zone and records
- Firewall rules and SSH key configuration

#### 3. Verify Node Provisioning

```bash
# Confirm VPS nodes are running via your cloud provider CLI or dashboard
# Note the public IP addresses of the provisioned nodes
```

### Phase 3: k3s Cluster Setup

Install k3s on the provisioned VPS nodes.

#### 1. Install k3s on the First Node (Server)

```bash
# SSH into the first node
ssh root@<node-1-ip>

# Install k3s server (disable Traefik, we use NGINX Ingress)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable traefik" sh -

# Get the node token for joining additional nodes
cat /var/lib/rancher/k3s/server/node-token

# Get the kubeconfig
cat /etc/rancher/k3s/k3s.yaml
```

#### 2. Join Additional Nodes (Optional)

```bash
# SSH into additional nodes and join them to the cluster
ssh root@<node-N-ip>

curl -sfL https://get.k3s.io | K3S_URL=https://<node-1-ip>:6443 K3S_TOKEN=<node-token> sh -
```

#### 3. Configure Local kubectl Access

Copy the kubeconfig from the server node to your local machine. Update the `server` address to the node's public IP:

```bash
# Copy kubeconfig locally
scp root@<node-1-ip>:/etc/rancher/k3s/k3s.yaml ~/.kube/config-k3s

# Edit the server address
sed -i '' 's/127.0.0.1/<node-1-ip>/g' ~/.kube/config-k3s

# Set as current context
export KUBECONFIG=~/.kube/config-k3s

# Verify connectivity
kubectl get nodes
```

### Phase 4: Flux Bootstrap

Bootstrap Flux to enable GitOps-driven deployment from your Git repository.

#### 1. Bootstrap Flux

```bash
flux bootstrap github \
  --owner=<github-owner> \
  --repository=<repository-name> \
  --branch=main \
  --path=manifests/clusters/my-cluster \
  --personal
```

This installs the Flux controllers in the cluster and configures them to watch your repository for changes.

#### 2. Verify Flux Installation

```bash
# Check Flux components
kubectl get pods -n flux-system

# Verify Git source sync
flux get sources git

# Check Kustomization status
flux get kustomizations
```

### Phase 5: Secret Setup (SOPS+age)

Configure encrypted secrets for the cluster.

#### 1. Generate an age Key Pair

```bash
# Generate a new age key pair
age-keygen -o age.key

# The public key is printed to stdout, e.g.:
# age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Save this public key for .sops.yaml configuration
```

#### 2. Configure .sops.yaml

Create or update `.sops.yaml` in the repository root with your age public key:

```yaml
creation_rules:
  - path_regex: \.secret\.enc\.yaml$
    age: >-
      age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 3. Create the Flux Decryption Secret

Load the age private key into the cluster so Flux can decrypt secrets:

```bash
kubectl create secret generic sops-age \
  --namespace=flux-system \
  --from-file=age.agekey=age.key
```

#### 4. Encrypt Secrets

For each application that needs secrets:

```bash
# Copy the template to an encrypted file
cp manifests/apps/myapp/secrets.secret.template.yaml \
   manifests/apps/myapp/secrets.secret.enc.yaml

# Edit and fill in real values
$EDITOR manifests/apps/myapp/secrets.secret.enc.yaml

# Encrypt in-place
sops -e -i manifests/apps/myapp/secrets.secret.enc.yaml

# Commit the encrypted file
git add manifests/apps/myapp/secrets.secret.enc.yaml
git commit -m "Add encrypted secrets for myapp"
git push
```

See [SECRETS.md](SECRETS.md) for detailed secret management instructions.

### Phase 6: Application Deployment

Once Flux is bootstrapped and secrets are configured, applications deploy automatically via GitOps.

Flux reconciles the manifests in your repository and deploys components in dependency order:

1. **MetalLB** -- bare-metal load balancer
2. **NGINX Ingress Controller** -- HTTP/HTTPS traffic routing
3. **cert-manager** -- TLS certificate automation
4. **Dex** -- OIDC identity provider
5. **OAuth2-Proxy** -- authentication enforcement
6. **Database operators** -- CloudNativePG, Redis Operator
7. **Applications** -- Mattermost, Nextcloud, Forgejo, Homepage, AI Gateway
8. **Per-tenant services** -- Kanidm, Stalwart Mail

Monitor the deployment:

```bash
# Watch all Flux Kustomizations
flux get kustomizations --watch

# Watch pods across all namespaces
kubectl get pods --all-namespaces --watch

# Check for any reconciliation errors
flux events --all-namespaces
```

## Verification

### 1. Cluster Health

```bash
# Node status
kubectl get nodes -o wide

# System pods
kubectl get pods -n kube-system

# Storage classes
kubectl get storageclass

# Persistent volumes
kubectl get pv,pvc --all-namespaces
```

### 2. GitOps Status

```bash
# Flux overall status
flux get all

# Git source sync
flux get sources git

# All Kustomizations
flux get kustomizations

# Check for failed reconciliations
flux events --all-namespaces
```

### 3. Networking

```bash
# MetalLB address pools
kubectl get ipaddresspool -n metallb-system

# NGINX Ingress controller
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# Ingress resources
kubectl get ingress --all-namespaces

# TLS certificates
kubectl get certificates --all-namespaces
```

### 4. Application Access

Test application accessibility:

```bash
# Check DNS resolution
dig chat.yourdomain.com
dig cloud.yourdomain.com
dig git.yourdomain.com

# Test HTTPS
curl -I https://chat.yourdomain.com
curl -I https://cloud.yourdomain.com
curl -I https://git.yourdomain.com
```

### 5. Secret Decryption

```bash
# Verify secrets are created from encrypted sources
kubectl get secrets --all-namespaces | grep -v default-token

# Check Flux decryption status in Kustomization events
kubectl describe kustomization -n flux-system apps
```

## Troubleshooting

### k3s Issues

**Nodes not joining the cluster:**
```bash
# Check k3s service status on the node
systemctl status k3s
journalctl -u k3s -f

# Verify the node token and server URL
# Ensure firewall allows port 6443 between nodes
```

**kubectl connection refused:**
```bash
# Verify kubeconfig server address matches the node public IP
# Ensure port 6443 is open in the cloud provider firewall
# Check k3s is running: systemctl status k3s
```

### Flux Issues

**Flux not syncing:**
```bash
# Force reconciliation
flux reconcile source git flux-system

# Check Flux controller logs
flux logs --all-namespaces

# Verify GitHub token in cluster
kubectl get secrets -n flux-system
```

**Kustomization errors:**
```bash
# Check specific Kustomization status
flux get kustomization <name> -o yaml

# View reconciliation events
flux events --for Kustomization/<name>
```

### SOPS Decryption Failures

**Secrets not decrypting:**
```bash
# Verify the sops-age secret exists
kubectl get secret sops-age -n flux-system

# Check that the age key matches the .sops.yaml public key
# The private key in the cluster must correspond to the public key used for encryption

# Check Kustomization decryption config
kubectl get kustomization -n flux-system <name> -o yaml | grep -A3 decryption
```

### NGINX Ingress Issues

**Ingress not routing traffic:**
```bash
# Check NGINX Ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Verify Ingress resource configuration
kubectl describe ingress <name> -n <namespace>

# Check MetalLB has assigned an external IP
kubectl get svc -n ingress-nginx
```

### Application Issues

**Pods in CrashLoopBackOff:**
```bash
# Check pod logs
kubectl logs -n <namespace> <pod-name>

# Check pod events
kubectl describe pod -n <namespace> <pod-name>

# Check resource constraints
kubectl top nodes
kubectl top pods --all-namespaces
```

**Database connection failures:**
```bash
# Check CloudNativePG cluster status
kubectl get clusters.postgresql.cnpg.io --all-namespaces

# Check database pod logs
kubectl logs -n <namespace> <cluster-name>-1
```

## Post-Deployment

### 1. Application Setup

Complete application-specific initial configuration:

1. **Mattermost**: Create the first team and admin user
2. **Nextcloud**: Complete the initial setup wizard
3. **Forgejo**: Create the admin user and configure settings
4. **Homepage**: Verify dashboard widgets are loading

### 2. Monitoring Setup

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80

# Verify Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

### 3. Backup Verification

```bash
# Check Velero backup schedules
kubectl get schedules -n velero

# Check recent backups
kubectl get backups -n velero

# Verify database backups
kubectl get clusters.postgresql.cnpg.io --all-namespaces -o wide
```

### 4. Tailscale VPN

Configure Tailscale for secure administrative access:

```bash
# Verify Tailscale operator
kubectl get pods -n tailscale

# Check Tailscale status
kubectl get tailscalestatus --all-namespaces
```
