# DigitalOcean Infrastructure

CDKTF stack that provisions [DigitalOcean](https://digitalocean.pxf.io/3evZdB) Droplets for a k3s cluster.

> **Note:** This creates raw Droplets, NOT managed DOKS. This is designed for self-managed k3s clusters.

## What it creates

- 3x Droplets (configurable size/count)
- VPC for private networking (10.10.0.0/16)
- Cloud Firewall with k3s, Tailscale, and mail rules
- Load Balancer for web traffic (HTTP/HTTPS passthrough)

## Prerequisites

- [DigitalOcean API token](https://digitalocean.pxf.io/je2Ggv)
- AWS credentials (for S3 state backend)
- SSH public key

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DIGITALOCEAN_TOKEN` | Yes | - | DigitalOcean API token |
| `SSH_PUBLIC_KEY` | Yes | - | SSH public key for Droplet access |
| `DOMAIN` | No | `example.com` | Base domain |
| `PROJECT_NAME` | No | `my-cluster` | Project name for resource naming |
| `STATE_BUCKET` | No | `my-terraform-state` | S3 bucket for Terraform state |
| `AWS_REGION` | No | `us-east-1` | AWS region for state backend |
| `DROPLET_SIZE` | No | `s-4vcpu-8gb` | Droplet size slug |
| `DO_REGION` | No | `nyc1` | DigitalOcean region |
| `DROPLET_COUNT` | No | `3` | Number of Droplets |

## Usage

```bash
bun install
bun run get
bun run plan
bun run deploy
```

> **Note:** [DigitalOcean](https://digitalocean.pxf.io/3evZdB) links in this project are affiliate links that support template maintenance.
