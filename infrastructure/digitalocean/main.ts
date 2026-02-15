#!/usr/bin/env tsx
/**
 * DigitalOcean infrastructure provisioning with CDKTF
 *
 * Provisions:
 * - 3x Droplets for HA k3s cluster
 * - VPC for private networking
 * - Cloud Firewall
 * - Load Balancer for public ingress
 *
 * Note: This provisions raw Droplets (NOT managed DOKS),
 * suitable for self-managed k3s clusters.
 */

import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, S3Backend } from 'cdktf';
import { DigitaloceanProvider } from './.gen/providers/digitalocean/provider';
import { Droplet } from './.gen/providers/digitalocean/droplet';
import { SshKey } from './.gen/providers/digitalocean/ssh-key';
import { Firewall } from './.gen/providers/digitalocean/firewall';
import { Vpc } from './.gen/providers/digitalocean/vpc';
import { Loadbalancer } from './.gen/providers/digitalocean/loadbalancer';
import { AwsProvider } from './.gen/providers/aws/provider';

interface DOStackConfig {
  doToken: string;
  awsRegion: string;
  domain: string;
  projectName: string;
  sshPublicKey: string;
  stateBucket: string;
  dropletSize?: string;
  region?: string;
  dropletCount?: number;
}

class DigitalOceanStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: DOStackConfig) {
    super(scope, id);

    // S3 backend for Terraform state
    new S3Backend(this, {
      bucket: config.stateBucket,
      key: 'digitalocean/terraform.tfstate',
      region: config.awsRegion,
      encrypt: true,
    });

    new DigitaloceanProvider(this, 'digitalocean', {
      token: config.doToken,
    });

    new AwsProvider(this, 'aws', {
      region: config.awsRegion,
    });

    const dropletSize = config.dropletSize || 's-4vcpu-8gb';
    const region = config.region || 'nyc1';
    const dropletCount = config.dropletCount || 3;

    // SSH Key
    const sshKey = new SshKey(this, 'main-ssh-key', {
      name: `${config.projectName}-k3s-key`,
      publicKey: config.sshPublicKey,
    });

    // VPC for private networking
    const vpc = new Vpc(this, 'k3s-vpc', {
      name: `${config.projectName}-k3s`,
      region: region,
      ipRange: '10.10.0.0/16',
    });

    // Cloud Firewall
    const firewall = new Firewall(this, 'k3s-firewall', {
      name: `${config.projectName}-k3s-firewall`,
      inboundRule: [
        // SSH
        { protocol: 'tcp', portRange: '22', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        // HTTP
        { protocol: 'tcp', portRange: '80', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        // HTTPS
        { protocol: 'tcp', portRange: '443', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        // Kubernetes API
        { protocol: 'tcp', portRange: '6443', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        // Tailscale
        { protocol: 'udp', portRange: '41641', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        // Inter-node (VPC range)
        { protocol: 'tcp', portRange: '1-65535', sourceAddresses: ['10.10.0.0/16'] },
        { protocol: 'udp', portRange: '1-65535', sourceAddresses: ['10.10.0.0/16'] },
        // Mail ports
        { protocol: 'tcp', portRange: '25', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'tcp', portRange: '143', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'tcp', portRange: '465', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'tcp', portRange: '587', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'tcp', portRange: '993', sourceAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'tcp', portRange: '4190', sourceAddresses: ['0.0.0.0/0', '::/0'] },
      ],
      outboundRule: [
        { protocol: 'tcp', portRange: '1-65535', destinationAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'udp', portRange: '1-65535', destinationAddresses: ['0.0.0.0/0', '::/0'] },
        { protocol: 'icmp', destinationAddresses: ['0.0.0.0/0', '::/0'] },
      ],
    });

    // Create Droplets
    const droplets: Droplet[] = [];
    for (let i = 1; i <= dropletCount; i++) {
      const droplet = new Droplet(this, `k3s-node-${i}`, {
        name: `${config.projectName}-node${i}`,
        size: dropletSize,
        image: 'ubuntu-24-04-x64',
        region: region,
        vpcUuid: vpc.id,
        sshKeys: [sshKey.fingerprint],
        tags: [`k3s`, config.projectName, `node${i}`],
        userData: `#!/bin/bash
# Prepare for k3s installation
apt-get update
apt-get install -y curl open-iscsi nfs-common

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
        `,
      });
      droplets.push(droplet);
    }

    // Apply firewall to droplets
    firewall.addOverride('droplet_ids', droplets.map(d => `\${${d.fqn}.id}`));

    // Load Balancer for web traffic
    const lb = new Loadbalancer(this, 'web-lb', {
      name: `${config.projectName}-web`,
      region: region,
      vpcUuid: vpc.id,
      dropletIds: droplets.map(d => d.id) as unknown as number[],
      forwardingRule: [
        { entryPort: 80, entryProtocol: 'http', targetPort: 80, targetProtocol: 'http' },
        { entryPort: 443, entryProtocol: 'https', targetPort: 443, targetProtocol: 'https', tlsPassthrough: true },
      ],
      healthcheck: {
        port: 80,
        protocol: 'tcp',
        checkIntervalSeconds: 15,
        responseTimeoutSeconds: 10,
        unhealthyThreshold: 3,
        healthyThreshold: 3,
      },
    });

    // Outputs
    new TerraformOutput(this, 'load-balancer-ip', {
      value: lb.ip,
      description: 'Public IP of the Web Load Balancer',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    for (let i = 0; i < droplets.length; i++) {
      new TerraformOutput(this, `node${i + 1}-ipv4`, {
        value: droplets[i].ipv4Address,
        description: `Public IPv4 of node${i + 1}`,
      });

      new TerraformOutput(this, `node${i + 1}-private-ip`, {
        value: droplets[i].ipv4AddressPrivate,
        description: `Private IP of node${i + 1}`,
      });
    }
  }
}

const app = new App();

const config: DOStackConfig = {
  doToken: process.env.DIGITALOCEAN_TOKEN || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  domain: process.env.DOMAIN || 'example.com',
  projectName: process.env.PROJECT_NAME || 'my-cluster',
  sshPublicKey: process.env.SSH_PUBLIC_KEY || '',
  stateBucket: process.env.STATE_BUCKET || 'my-terraform-state',
  dropletSize: process.env.DROPLET_SIZE || 's-4vcpu-8gb',
  region: process.env.DO_REGION || 'nyc1',
  dropletCount: parseInt(process.env.DROPLET_COUNT || '3', 10),
};

if (!config.doToken) throw new Error('DIGITALOCEAN_TOKEN environment variable is required');
if (!config.sshPublicKey) throw new Error('SSH_PUBLIC_KEY environment variable is required');

new DigitalOceanStack(app, 'digitalocean-k3s', config);

app.synth();
