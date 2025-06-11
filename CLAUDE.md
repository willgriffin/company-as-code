# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **GitHub template repository** for deploying complete Kubernetes infrastructure on [DigitalOcean](https://digitalocean.pxf.io/3evZdB) using GitOps with Flux. It provides one-click deployment of a production-ready cluster with optional applications (Keycloak, Mattermost, Nextcloud, Mailu).

The repository follows Infrastructure as Code principles using Terraform and GitOps with Flux v2.

## Architecture & Key Components

### Infrastructure as Code (IaC)
- **Terraform** (v1.12.1) - Primary infrastructure provisioning with DigitalOcean provider
- **DigitalOcean** - Cloud platform (Kubernetes clusters, DNS, Spaces storage)
- **Backend**: Terraform state stored in DigitalOcean Spaces (S3-compatible)

### GitOps & Continuous Deployment
- **Flux v2** (v2.3.0) - GitOps operator for Kubernetes continuous deployment
- **Kustomize** - Kubernetes native configuration management with overlays
- **Git-based workflows** - Branch-based deployments from main branch

### Container Orchestration & Applications
- **Kubernetes** (v1.31.0) - Container orchestration platform
- **Applications deployed**:
  - **Nextcloud** (v28-apache) - Cloud storage platform
  - **Mattermost** (v9.2) - Team collaboration
  - **Keycloak** (v26.0.7) - Identity and access management
  - **Mailu** (v1.5.0) - Email server suite

### Kubernetes Operators
- **CloudNativePG** - PostgreSQL operator for database clusters
- **Redis Operator** - Redis cluster management for caching
- **Keycloak Operator** - Identity management automation

### Networking & Security
- **Traefik** - Cloud-native reverse proxy and ingress controller
- **cert-manager** - Automatic TLS certificate management with Let's Encrypt
- **External DNS** - Automatic DNS record management with DigitalOcean
- **OAuth2 Proxy** - Authentication proxy for OIDC/OAuth2 integration

### Secret Management
- **SOPS** (v3.8.1) - Secrets Operations for encrypting secrets at rest
- **Age** (v1.1.1) - Modern encryption tool for public key encryption
- **Encrypted GitOps**: Secrets encrypted in Git repository using Age/SOPS

## Tools and Technologies

### Core CLI Tools (versions in tool-versions.txt)
- **kubectl** (v1.31.0) - Kubernetes CLI
- **flux** (v2.3.0) - Flux CLI for GitOps management
- **terraform** (v1.12.1) - Infrastructure as Code
- **doctl** (v1.117.0) - DigitalOcean CLI
- **sops** (v3.8.1) - Secret encryption
- **age** (v1.1.1) - Encryption key management
- **yq** (v4.44.3) - YAML processor
- **gomplate** (v3.11.7) - Template processor for dynamic configuration

### Configuration Management
- **Template Processing**: gomplate for dynamic YAML generation
- **Configuration File**: `config.yaml` (copy from `config.yaml.example`)
- **Environment Variables**: Repository secrets for sensitive data
- **Tool Versions**: Centralized in `tool-versions.txt` for CI/CD caching

### CI/CD & Automation
- **GitHub Actions** - Multi-stage deployment pipelines
- **Custom Actions**: 
  - `setup-tools` - Installs and caches GitOps tools
  - `validate-config` - Repository configuration validation
- **Automation Scripts**: Comprehensive bash scripts in `/scripts/` directory

### Database & Storage
- **PostgreSQL** - Primary database via CloudNativePG operator
- **Redis** - Caching and session storage via Redis operator
- **DigitalOcean Spaces** - Object storage for Terraform state and backups

## Project Structure

### Key Directories
- `/flux/` - GitOps manifests organized by cluster
- `/terraform/` - Infrastructure as Code definitions
- `/scripts/` - Automation scripts for cluster lifecycle
- `/.github/` - CI/CD workflows and actions
- `/docs/` - Documentation for secrets, dependencies, templates

### Important Files
- `config.yaml` - Main configuration (copy from example)
- `tool-versions.txt` - Tool version definitions for CI caching
- `.sops.yaml` - SOPS encryption configuration
- `WORKFLOW.md` - Issue management workflow specification

## Affiliate Links & External References

When referencing DigitalOcean in markdown files:
- Use [digitalocean.pxf.io/3evZdB](https://digitalocean.pxf.io/3evZdB) to link to Digital Ocean's frontpage
- Use [digitalocean.pxf.io/je2Ggv](https://digitalocean.pxf.io/je2Ggv) when linking to API tokens
- When referencing API tokens, format as: [https://cloud.digitalocean.com/account/api/tokens](https://digitalocean.pxf.io/je2Ggv)
- Include a note in each README that links to Digital Ocean are affiliate links supporting template maintenance

## Development Workflow

### Issue Management
- Follows Kanban-style workflow defined in `WORKFLOW.md`
- Status-based labeling system (`status:new-issue`, `status:backlog`, etc.)
- Automated progression through workflow stages

### Secret Management
- Use `scripts/generate-secrets` for initial secret generation
- SOPS encryption for all sensitive data in Git
- Age public key encryption for GitOps workflows

### Deployment Process
1. Update `config.yaml` with your specific configuration
2. Run initial setup scripts
3. Terraform provisions infrastructure
4. Flux deploys applications via GitOps

## Synchronization Rules
- `.claude/commands/issue.md` and `WORKFLOW.md` should always be reflective of each other. If a change is requested to either, it should be echo'd in the other.
- `tool-versions.txt` drives CI/CD tool caching and should be updated when tool versions change
