#!/usr/bin/env tsx
/**
 * Hetzner Cloud infrastructure provisioning with CDKTF
 *
 * Provisions:
 * - 3x VPS servers for HA k3s cluster
 * - Private network for inter-node communication
 * - Hetzner Load Balancer for public ingress
 * - Route53 DNS records pointing to Load Balancer
 */

import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, S3Backend, Token } from 'cdktf';
import { HcloudProvider } from './.gen/providers/hcloud/provider';
import { Server } from './.gen/providers/hcloud/server';
import { SshKey } from './.gen/providers/hcloud/ssh-key';
import { Firewall } from './.gen/providers/hcloud/firewall';
import { Network } from './.gen/providers/hcloud/network';
import { NetworkSubnet } from './.gen/providers/hcloud/network-subnet';
import { LoadBalancer } from './.gen/providers/hcloud/load-balancer';
import { LoadBalancerService } from './.gen/providers/hcloud/load-balancer-service';
import { LoadBalancerTargetA } from './.gen/providers/hcloud/load-balancer-target';
import { LoadBalancerNetwork } from './.gen/providers/hcloud/load-balancer-network';
import { Route53Record } from './.gen/providers/aws/route53-record';
import { AwsProvider } from './.gen/providers/aws/provider';

interface HetznerStackConfig {
  hcloudToken: string;
  awsRegion: string;
  domain: string;
  projectName: string;
  hostedZoneId: string;
  sshPublicKey: string;
  stateBucket: string;
  serverType?: string;
  location?: string;
  serverCount?: number;
}

class HetznerStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: HetznerStackConfig) {
    super(scope, id);

    // S3 backend for Terraform state
    new S3Backend(this, {
      bucket: config.stateBucket,
      key: 'hetzner/terraform.tfstate',
      region: config.awsRegion,
      encrypt: true,
    });

    // Hetzner Cloud Provider
    new HcloudProvider(this, 'hcloud', {
      token: config.hcloudToken,
    });

    // AWS Provider for Route53 DNS
    new AwsProvider(this, 'aws', {
      region: config.awsRegion,
    });

    // Configuration
    const serverType = config.serverType || 'cpx31';
    const location = config.location || 'ash'; // US East (Ashburn)
    const serverCount = config.serverCount || 3;

    // SSH Key for server access
    const sshKey = new SshKey(this, 'main-ssh-key', {
      name: `${config.projectName}-k3s-key`,
      publicKey: config.sshPublicKey,
    });

    // Private network for VPS inter-node communication
    const network = new Network(this, 'vps-network', {
      name: `${config.projectName}-vps`,
      ipRange: '10.0.0.0/16',
      labels: {
        cluster: config.projectName,
        managed_by: 'cdktf',
      },
    });

    // Subnet for VPS nodes
    const subnet = new NetworkSubnet(this, 'vps-subnet', {
      networkId: Token.asNumber(network.id),
      type: 'cloud',
      networkZone: 'us-east',
      ipRange: '10.0.1.0/24',
    });

    // Firewall rules for VPS nodes
    const firewall = new Firewall(this, 'vps-firewall', {
      name: `${config.projectName}-k3s-firewall`,
      rule: [
        // Allow all traffic from private network (LB health checks + inter-node)
        {
          direction: 'in',
          protocol: 'tcp',
          port: 'any',
          sourceIps: ['10.0.0.0/16'],
        },
        {
          direction: 'in',
          protocol: 'udp',
          port: 'any',
          sourceIps: ['10.0.0.0/16'],
        },
        {
          direction: 'in',
          protocol: 'icmp',
          sourceIps: ['10.0.0.0/16'],
        },
        // SSH
        {
          direction: 'in',
          protocol: 'tcp',
          port: '22',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        // HTTP
        {
          direction: 'in',
          protocol: 'tcp',
          port: '80',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        // HTTPS
        {
          direction: 'in',
          protocol: 'tcp',
          port: '443',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        // Kubernetes API
        {
          direction: 'in',
          protocol: 'tcp',
          port: '6443',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        // Tailscale
        {
          direction: 'in',
          protocol: 'udp',
          port: '41641',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        // Mail ports (SMTP, submission, IMAP, SMTPS, IMAPS, Sieve)
        {
          direction: 'in',
          protocol: 'tcp',
          port: '25',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        {
          direction: 'in',
          protocol: 'tcp',
          port: '143',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        {
          direction: 'in',
          protocol: 'tcp',
          port: '465',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        {
          direction: 'in',
          protocol: 'tcp',
          port: '587',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        {
          direction: 'in',
          protocol: 'tcp',
          port: '993',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
        {
          direction: 'in',
          protocol: 'tcp',
          port: '4190',
          sourceIps: ['0.0.0.0/0', '::/0'],
        },
      ],
    });

    // Create VPS servers
    const servers: Server[] = [];
    for (let i = 1; i <= serverCount; i++) {
      const server = new Server(this, `edge-server-${i}`, {
        name: `edge${i}`,
        serverType: serverType,
        location: location,
        image: 'ubuntu-24.04',
        sshKeys: [sshKey.id],
        firewallIds: [Token.asNumber(firewall.id)],

        userData: `#!/bin/bash
# Prepare for k3s installation
apt-get update
apt-get install -y curl open-iscsi nfs-common

# Install Tailscale (will need auth key from secrets)
curl -fsSL https://tailscale.com/install.sh | sh
        `,

        labels: {
          role: 'k3s-server',
          cluster: config.projectName,
          node: `edge${i}`,
          managed_by: 'cdktf',
        },

        backups: false,

        publicNet: [{
          ipv4Enabled: true,
          ipv6Enabled: true,
        }],

        network: [{
          networkId: Token.asNumber(network.id),
          ip: `10.0.1.${10 + i}`,
        }],
      });

      server.addOverride('depends_on', [`hcloud_network_subnet.${subnet.friendlyUniqueId}`]);
      servers.push(server);
    }

    // Hetzner Load Balancer - Web traffic
    const lb = new LoadBalancer(this, 'ingress-lb', {
      name: `${config.projectName}-ingress`,
      loadBalancerType: 'lb11',
      location: location,
      labels: {
        cluster: config.projectName,
        purpose: 'web',
        managed_by: 'cdktf',
      },
    });

    // Hetzner Load Balancer - Mail traffic
    const mailLb = new LoadBalancer(this, 'mail-lb', {
      name: `${config.projectName}-mail`,
      loadBalancerType: 'lb11',
      location: location,
      labels: {
        cluster: config.projectName,
        purpose: 'mail',
        managed_by: 'cdktf',
      },
    });

    // Attach Web Load Balancer to private network
    const lbNetwork = new LoadBalancerNetwork(this, 'lb-network', {
      loadBalancerId: Token.asNumber(lb.id),
      networkId: Token.asNumber(network.id),
      ip: '10.0.1.1',
    });
    lbNetwork.addOverride('depends_on', [`hcloud_network_subnet.${subnet.friendlyUniqueId}`]);

    // Attach Mail Load Balancer to private network
    const mailLbNetwork = new LoadBalancerNetwork(this, 'mail-lb-network', {
      loadBalancerId: Token.asNumber(mailLb.id),
      networkId: Token.asNumber(network.id),
      ip: '10.0.1.2',
    });
    mailLbNetwork.addOverride('depends_on', [`hcloud_network_subnet.${subnet.friendlyUniqueId}`]);

    // Add servers as Web LB targets
    for (let i = 0; i < servers.length; i++) {
      const target = new LoadBalancerTargetA(this, `lb-target-${i + 1}`, {
        loadBalancerId: Token.asNumber(lb.id),
        type: 'server',
        serverId: Token.asNumber(servers[i].id),
        usePrivateIp: true,
      });
      target.addOverride('depends_on', [`hcloud_load_balancer_network.${lbNetwork.friendlyUniqueId}`]);
    }

    // Add servers as Mail LB targets
    for (let i = 0; i < servers.length; i++) {
      const target = new LoadBalancerTargetA(this, `mail-lb-target-${i + 1}`, {
        loadBalancerId: Token.asNumber(mailLb.id),
        type: 'server',
        serverId: Token.asNumber(servers[i].id),
        usePrivateIp: true,
      });
      target.addOverride('depends_on', [`hcloud_load_balancer_network.${mailLbNetwork.friendlyUniqueId}`]);
    }

    // LB HTTP service
    new LoadBalancerService(this, 'lb-http', {
      loadBalancerId: Token.asNumber(lb.id),
      protocol: 'tcp',
      listenPort: 80,
      destinationPort: 80,
      healthCheck: { protocol: 'tcp', port: 80, interval: 15, timeout: 10, retries: 3 },
    });

    // LB HTTPS service
    new LoadBalancerService(this, 'lb-https', {
      loadBalancerId: Token.asNumber(lb.id),
      protocol: 'tcp',
      listenPort: 443,
      destinationPort: 443,
      healthCheck: { protocol: 'tcp', port: 443, interval: 15, timeout: 10, retries: 3 },
    });

    // Mail LB services
    const mailPorts = [
      { name: 'smtp', port: 25 },
      { name: 'submission', port: 587 },
      { name: 'imap', port: 143 },
      { name: 'smtps', port: 465 },
      { name: 'imaps', port: 993 },
      { name: 'sieve', port: 4190 },
    ];

    for (const svc of mailPorts) {
      new LoadBalancerService(this, `mail-lb-${svc.name}`, {
        loadBalancerId: Token.asNumber(mailLb.id),
        protocol: 'tcp',
        listenPort: svc.port,
        destinationPort: svc.port,
        healthCheck: { protocol: 'tcp', port: svc.port, interval: 15, timeout: 10, retries: 3 },
      });
    }

    // DNS Records
    new Route53Record(this, 'vps-a-record', {
      zoneId: config.hostedZoneId,
      name: `vps.${config.domain}`,
      type: 'A',
      ttl: 300,
      records: [lb.ipv4],
    });

    new Route53Record(this, 'vps-wildcard-a-record', {
      zoneId: config.hostedZoneId,
      name: `*.vps.${config.domain}`,
      type: 'A',
      ttl: 300,
      records: [lb.ipv4],
    });

    new Route53Record(this, 'mail-a-record', {
      zoneId: config.hostedZoneId,
      name: `mail.${config.domain}`,
      type: 'A',
      ttl: 300,
      records: [mailLb.ipv4],
    });

    // Individual server DNS records (for direct access)
    for (let i = 0; i < servers.length; i++) {
      new Route53Record(this, `edge${i + 1}-aaaa-record`, {
        zoneId: config.hostedZoneId,
        name: `edge${i + 1}.${config.domain}`,
        type: 'AAAA',
        ttl: 300,
        records: [servers[i].ipv6Address],
      });
    }

    // Outputs
    new TerraformOutput(this, 'load-balancer-ipv4', {
      value: lb.ipv4,
      description: 'Public IPv4 address of the Web Load Balancer',
    });

    new TerraformOutput(this, 'mail-load-balancer-ipv4', {
      value: mailLb.ipv4,
      description: 'Public IPv4 address of the Mail Load Balancer',
    });

    new TerraformOutput(this, 'network-id', {
      value: network.id,
      description: 'Hetzner private network ID',
    });

    for (let i = 0; i < servers.length; i++) {
      new TerraformOutput(this, `edge${i + 1}-ipv6`, {
        value: servers[i].ipv6Address,
        description: `Public IPv6 address of edge${i + 1}`,
      });

      new TerraformOutput(this, `edge${i + 1}-private-ip`, {
        value: `10.0.1.${11 + i}`,
        description: `Private IP address of edge${i + 1}`,
      });
    }
  }
}

// Main app
const app = new App();

const config: HetznerStackConfig = {
  hcloudToken: process.env.HCLOUD_TOKEN || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  domain: process.env.DOMAIN || 'example.com',
  projectName: process.env.PROJECT_NAME || 'my-cluster',
  hostedZoneId: process.env.HOSTED_ZONE_ID || '',
  sshPublicKey: process.env.SSH_PUBLIC_KEY || '',
  stateBucket: process.env.STATE_BUCKET || 'my-terraform-state',
  serverType: process.env.SERVER_TYPE || 'cpx31',
  location: process.env.LOCATION || 'ash',
  serverCount: parseInt(process.env.SERVER_COUNT || '3', 10),
};

if (!config.hcloudToken) throw new Error('HCLOUD_TOKEN environment variable is required');
if (!config.hostedZoneId) throw new Error('HOSTED_ZONE_ID environment variable is required');
if (!config.sshPublicKey) throw new Error('SSH_PUBLIC_KEY environment variable is required');

new HetznerStack(app, 'hetzner-vps', config);

app.synth();
