# Terraform Infrastructure

This directory contains Terraform configurations for provisioning infrastructure across different cloud providers.

> **Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.

## Directory Structure

```
terraform/
├── digitalocean/     # DigitalOcean Kubernetes cluster configuration
│   ├── main.tf      # Main cluster resources
│   ├── variables.tf # Input variables
│   ├── outputs.tf   # Output values
│   └── backend.tf   # State management configuration
└── modules/         # Reusable Terraform modules (future)
```

## [DigitalOcean](https://digitalocean.pxf.io/3evZdB) Infrastructure

The DigitalOcean configuration provisions:
- Managed Kubernetes cluster (DOKS)
- Node pools with autoscaling
- VPC networking
- Project organization

### Prerequisites

1. DigitalOcean API token
2. Terraform >= 1.0
3. kubectl configured for cluster access

### Quick Start

```bash
cd terraform/digitalocean

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

### Configuration

Key variables in `terraform.tfvars`:
- `do_token` - DigitalOcean API token
- `cluster_name` - Kubernetes cluster name
- `region` - Deployment region
- `node_pool_size` - Initial node count
- `node_pool_min/max` - Autoscaling limits

### Outputs

After successful apply:
- `cluster_id` - Kubernetes cluster ID
- `cluster_endpoint` - API server endpoint
- `cluster_token` - Authentication token
- `kubeconfig` - Complete kubeconfig for kubectl

### State Management

Terraform state is stored remotely in DigitalOcean Spaces for team collaboration. Backend configuration is in `backend.tf`.

## Adding New Providers

To add infrastructure for other cloud providers:
1. Create new directory under `terraform/`
2. Follow similar structure (main.tf, variables.tf, outputs.tf)
3. Document provider-specific requirements
4. Update this README with new provider section

## Best Practices

- Always run `terraform plan` before applying
- Use workspaces for environment separation
- Tag all resources appropriately
- Keep sensitive values in terraform.tfvars (gitignored)
- Document all variables in variables.tf