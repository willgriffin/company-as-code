# [DigitalOcean](https://digitalocean.pxf.io/3evZdB) Kubernetes Cluster Configuration

This directory contains Terraform configuration for provisioning a Kubernetes cluster on [DigitalOcean](https://digitalocean.pxf.io/3evZdB).

> **Note**: Links to DigitalOcean are affiliate links that help support the maintenance of this template.

## Cluster Specifications

- **Name**: `cumulus`
- **Region**: `nyc3` (New York)
- **Kubernetes Version**: `1.32.2-do.1`
- **Node Configuration**:
  - Size: `s-1vcpu-2gb` ($14/month per node)
  - Autoscaling: Enabled (2-3 nodes)
  - Initial count: 2 nodes

## File Structure

- `main.tf` - Core cluster resource definitions and node pool configuration
- `variables.tf` - Input variable declarations for all configurable parameters
- `terraform.tfvars` - Default values for the deployment
- `backend.tf` - Remote state storage configuration (DigitalOcean Spaces)
- `outputs.tf` - Exported cluster information post-deployment
- `versions.tf` - Terraform and provider version constraints

## Usage

### Prerequisites

1. DigitalOcean API token
2. DigitalOcean Spaces credentials for state backend

### Deployment

```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply configuration
terraform apply
```

### Configuration Options

Key variables that can be customized:

- `cluster_name` - Kubernetes cluster name
- `region` - DigitalOcean region
- `node_size` - Droplet size for nodes
- `min_nodes` / `max_nodes` - Autoscaling limits
- `auto_scale` - Enable/disable autoscaling

## Maintenance

The cluster is configured with automatic maintenance windows on Sundays at 4:00 AM.

## Resource Tagging

All resources are tagged with:
- `kubernetes`
- `managed`
- `terraform`
- `production`
- Project name: `have-blueprint`