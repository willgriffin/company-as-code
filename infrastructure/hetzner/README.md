# Hetzner Cloud Infrastructure

CDKTF stack that provisions Hetzner Cloud VPS servers for a k3s cluster.

## What it creates

- 3x CPX31 VPS servers (configurable)
- Private network (10.0.0.0/16) for inter-node communication
- Web Load Balancer (HTTP/HTTPS)
- Mail Load Balancer (SMTP/IMAP/Sieve)
- Route53 DNS records
- Firewall rules for k3s, Tailscale, and mail

## Prerequisites

- Hetzner Cloud API token
- AWS credentials (for Route53 DNS and S3 state backend)
- SSH public key

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HCLOUD_TOKEN` | Yes | - | Hetzner Cloud API token |
| `HOSTED_ZONE_ID` | Yes | - | Route53 hosted zone ID |
| `SSH_PUBLIC_KEY` | Yes | - | SSH public key for server access |
| `DOMAIN` | No | `example.com` | Base domain |
| `PROJECT_NAME` | No | `my-cluster` | Project name for resource naming |
| `STATE_BUCKET` | No | `my-terraform-state` | S3 bucket for Terraform state |
| `AWS_REGION` | No | `us-east-1` | AWS region |
| `SERVER_TYPE` | No | `cpx31` | Hetzner server type |
| `LOCATION` | No | `ash` | Hetzner datacenter location |
| `SERVER_COUNT` | No | `3` | Number of servers |

## Usage

```bash
# Install dependencies
bun install

# Generate provider bindings
bun run get

# Preview changes
bun run plan

# Deploy
bun run deploy
```

> **Note:** [DigitalOcean](https://digitalocean.pxf.io/3evZdB) links in this project are affiliate links that support template maintenance.
