# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **GitHub template repository** for deploying self-managed k3s Kubernetes clusters on any cloud provider using GitOps with Flux v2. It supports multicloud deployments across Hetzner and [DigitalOcean](https://digitalocean.pxf.io/3evZdB), with multi-tenancy, enterprise applications, and SOPS-encrypted secrets stored directly in Git.

The repository follows Infrastructure as Code principles using CDKTF (Terraform CDK) and GitOps with Flux v2.

## Architecture & Key Components

### Infrastructure as Code (IaC)
- **CDKTF** (Terraform CDK) - TypeScript-based multicloud infrastructure provisioning
- **Hetzner** - VPS servers, load balancers, and private networks
- **DigitalOcean** - Droplets, VPC, and firewall rules
- **AWS S3** - Terraform state storage with versioning and encryption
- **Backend**: Terraform state stored in AWS S3 bucket

### GitOps & Continuous Deployment
- **Flux v2** (v2.6.4) - GitOps operator for Kubernetes continuous deployment
- **Kustomize** - Kubernetes native configuration management with overlays
- **Git-based workflows** - Branch-based deployments from main branch

### Container Orchestration
- **k3s** - Lightweight, self-managed Kubernetes distribution on VPS instances
- **MetalLB** - Bare-metal L2 load balancing for service IPs
- **Tailscale Operator** - Inter-node VPN mesh networking

### Applications
- **Mattermost** - Team collaboration with Dex OIDC integration
- **Nextcloud** - Cloud storage with Dex OIDC integration
- **Forgejo** - Self-hosted Git forge with Dex OIDC integration
- **Homepage** - Customizable dashboard with OAuth2-Proxy authentication
- **AI Gateway / LiteLLM** - AI service proxy with OAuth2-Proxy authentication

### Kubernetes Operators
- **CloudNativePG** - High-availability PostgreSQL clusters with automatic failover
- **OpsTree Redis Operator** - Distributed Redis cluster management for caching and sessions

### Networking & Security
- **NGINX Ingress Controller** - HTTP/HTTPS traffic routing and TLS termination
- **MetalLB** - Bare-metal L2 load balancer for service IP allocation
- **cert-manager** - Automatic TLS certificate management with Let's Encrypt
- **External-DNS** - Automatic DNS record management with AWS Route53
- **OAuth2-Proxy** - Authentication proxy for protecting dashboards and applications
- **Tailscale Operator** - Encrypted inter-node mesh VPN

### Identity & Authentication
- **Dex** - Centralized OIDC identity provider federated across applications
- **OAuth2-Proxy** - Authentication proxy for dashboard and application protection
- **Kanidm** - Per-tenant identity provider instances

### Secret Management
- **SOPS + age** - Secrets encrypted and stored directly in Git
- **Flux Decryption** - kustomize-controller decrypts SOPS secrets at reconciliation time
- **Template Pattern**: `*.secret.template.yaml` (reference) -> `*.secret.enc.yaml` (encrypted values)

### Monitoring & Operations
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Dashboards and visualization
- **Sablier** - Scale-to-zero workload hibernation for idle services
- **Velero** - Cluster-wide backup and disaster recovery

### Multi-Tenancy
- **Per-tenant isolation** with dedicated Kanidm, Stalwart Mail, PostgreSQL, Redis, and External-DNS
- **Tenant pattern** defined under `manifests/tenants/` with `example-org` as reference implementation

## Tools and Technologies

### Core CLI Tools (versions in tool-versions.txt)
- **kubectl** (v1.34.0) - Kubernetes CLI
- **flux** (v2.6.4) - Flux CLI for GitOps management
- **terraform** (v1.12.2) - Infrastructure as Code (via CDKTF)
- **yq** (v4.47.1) - YAML processor
- **sops** (v3.10.2) - Secret encryption/decryption tool
- **age** (v1.2.1) - Encryption key generation for SOPS
- **gomplate** (v4.3.3) - Template processor for dynamic configuration
- **actionlint** (v1.7.7) - GitHub Actions workflow linter

### Development Tools & Runtime
- **Node.js** (v22+) - Required runtime for CDKTF and scripts
- **bun** - Package manager and runtime
- **TypeScript** - Primary language for infrastructure and configuration
- **CDKTF** - Terraform CDK for type-safe infrastructure as code

### Configuration Management
- **SOPS Configuration**: `.sops.yaml` defines encryption rules and age public keys
- **Shared ConfigMaps**: `manifests/shared/config/` for infrastructure-config and resource-profiles
- **Tool Versions**: Centralized in `tool-versions.txt` for CI/CD caching

### CI/CD & Automation
- **GitHub Actions** - CI/CD pipelines
- **Custom Actions**:
  - `setup-tools` - Installs and caches GitOps tools from tool-versions.txt
  - `validate-config` - Repository configuration validation
  - `check-repository-status` - Repository health checks
- **CDKTF Stacks**: TypeScript-based multicloud infrastructure provisioning

### Database & Storage
- **PostgreSQL** - High-availability clusters via CloudNativePG operator
- **Redis** - Distributed caching and session storage via OpsTree Redis operator
- **AWS S3** - Terraform state storage with versioning and encryption

## Project Structure

### Key Directories
- `/manifests/` - GitOps manifests organized by function (clusters, system, applications, tenants)
- `/infrastructure/` - CDKTF infrastructure definitions (multicloud: hetzner, digitalocean)
- `/.github/` - CI/CD workflows and custom actions
- `/docs/` - Technical documentation for architecture and deployment
- `/archive/` - Archived legacy components from previous architecture

### Important Files
- `.sops.yaml` - SOPS encryption rules with age public key configuration
- `tool-versions.txt` - Tool version definitions for CI/CD caching
- `WORKFLOW.md` - Issue management workflow specification
- `package.json` - Root package configuration (bun)

## Affiliate Links & External References

When referencing DigitalOcean in markdown files:
- Use [digitalocean.pxf.io/3evZdB](https://digitalocean.pxf.io/3evZdB) to link to Digital Ocean's frontpage
- Use [digitalocean.pxf.io/je2Ggv](https://digitalocean.pxf.io/je2Ggv) when linking to API tokens
- When referencing API tokens, format as: [https://cloud.digitalocean.com/account/api/tokens](https://digitalocean.pxf.io/je2Ggv)
- Include a note in each README that links to Digital Ocean are affiliate links supporting template maintenance

## Development Workflow

### Issue Management
- Follows Kanban-style workflow defined in `WORKFLOW.md`. Please refer to that file for a detailed explanation of the issue management process.

### Secret Management
- Use SOPS + age for encrypting secrets in Git
- Template files (`*.secret.template.yaml`) provide secret structure reference
- Encrypted files (`*.secret.enc.yaml`) contain actual values encrypted with age
- Flux kustomize-controller decrypts secrets at reconciliation time
- Age private key stored as a Kubernetes secret on the cluster

### Deployment Process
1. CDKTF provisions VPS nodes, load balancers, and networking on the chosen cloud provider
2. k3s is installed on provisioned nodes to form the Kubernetes cluster
3. Flux is bootstrapped to the cluster with GitHub integration
4. SOPS-encrypted secrets are decrypted by Flux's kustomize-controller at deploy time
5. System components deploy (NGINX Ingress, MetalLB, cert-manager, Dex, databases)
6. Applications deploy with automatic OIDC integration via Dex
7. Tenants deploy with isolated per-tenant services (Kanidm, Stalwart, PostgreSQL, Redis)

## Synchronization Rules
- `.claude/commands/issue.md` and `WORKFLOW.md` should always be reflective of each other. If a change is requested to either, it should be echo'd in the other.
- `tool-versions.txt` drives CI/CD tool caching and should be updated when tool versions change

## Automation Notes
- **Automation Philosophy**: Minimize manual intervention in infrastructure and deployment processes
- Prefer declarative, idempotent configuration over manual setup steps

## Claude's Memories
- I don't need comments on how things used to be
