#!/usr/bin/env node

import { App, TerraformOutput, TerraformStack, Token } from 'cdktf';
import { Construct } from 'constructs';
import { Firewall, type FirewallRule } from './.gen/providers/hcloud/firewall/index.js';
import { HcloudProvider } from './.gen/providers/hcloud/provider/index.js';
import { LoadBalancer } from './.gen/providers/hcloud/load-balancer/index.js';
import { LoadBalancerNetwork } from './.gen/providers/hcloud/load-balancer-network/index.js';
import { LoadBalancerService } from './.gen/providers/hcloud/load-balancer-service/index.js';
import { LoadBalancerTargetA } from './.gen/providers/hcloud/load-balancer-target/index.js';
import { Network } from './.gen/providers/hcloud/network/index.js';
import { NetworkSubnet } from './.gen/providers/hcloud/network-subnet/index.js';
import { Server } from './.gen/providers/hcloud/server/index.js';
import { SshKey } from './.gen/providers/hcloud/ssh-key/index.js';

interface HetznerConfig {
  token?: string;
  namePrefix: string;
  sshPublicKey?: string;
  sshKeyName: string;
  networkCidr: string;
  subnetCidr: string;
  networkZone: string;
  firewallEnabled: boolean;
  firewallName: string;
  sshAllowedCidrs: string[];
  publicTcpPorts: number[];
  serverCount: number;
  serverType: string;
  location: string;
  image: string;
  loadBalancerEnabled: boolean;
  loadBalancerType: string;
  loadBalancerPorts: number[];
  loadBalancerDestinationPorts: number[];
}

const env = (name: string, fallback?: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value || fallback;
};

const booleanEnv = (name: string, fallback: boolean): boolean => {
  const value = env(name);
  if (value === undefined) return fallback;
  const normalized = value.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(
    `${name} must be one of true/false, 1/0, yes/no, or on/off; received ${JSON.stringify(value)}`
  );
};

const integerEnv = (name: string, fallback: number, minimum = 0): number => {
  const raw = env(name);
  if (raw === undefined) return fallback;
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be a whole number; received ${JSON.stringify(raw)}`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be a whole number greater than or equal to ${minimum}`);
  }
  return value;
};

const listEnv = (name: string, fallback: string[] = []): string[] => {
  const value = env(name);
  return value === undefined
    ? fallback
    : value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
};

const portListEnv = (name: string, fallback: number[] = []): number[] => {
  const rawPorts = listEnv(name, fallback.map(String));
  const ports = rawPorts.map(raw => {
    if (!/^\d+$/.test(raw)) {
      throw new Error(`${name} contains an invalid TCP port ${JSON.stringify(raw)}`);
    }
    const port = Number(raw);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
      throw new Error(`${name} TCP ports must be between 1 and 65535; received ${raw}`);
    }
    return port;
  });
  if (new Set(ports).size !== ports.length) {
    throw new Error(`${name} must not contain duplicate TCP ports`);
  }
  return ports;
};

function loadConfig(): HetznerConfig {
  const loadBalancerEnabled = booleanEnv('ENABLE_LOAD_BALANCER', false);
  const loadBalancerPorts = portListEnv('LOAD_BALANCER_PORTS', [80, 443]);
  const loadBalancerDestinationPorts = portListEnv(
    'LOAD_BALANCER_DESTINATION_PORTS',
    [30080, 30443]
  );
  if (loadBalancerPorts.length !== loadBalancerDestinationPorts.length) {
    throw new Error(
      'LOAD_BALANCER_PORTS and LOAD_BALANCER_DESTINATION_PORTS must contain the same number of ports'
    );
  }

  return {
    token: env('HCLOUD_TOKEN'),
    namePrefix: env('NAME_PREFIX', 'cluster')!,
    sshPublicKey: env('SSH_PUBLIC_KEY'),
    sshKeyName: env('SSH_KEY_NAME', 'cluster-access')!,
    networkCidr: env('PRIVATE_NETWORK_CIDR', '10.0.0.0/16')!,
    subnetCidr: env('PRIVATE_SUBNET_CIDR', '10.0.1.0/24')!,
    networkZone: env('NETWORK_ZONE', 'eu-central')!,
    firewallEnabled: booleanEnv('ENABLE_FIREWALL', true),
    firewallName: env('FIREWALL_NAME', 'cluster-firewall')!,
    // An empty list intentionally creates no public SSH rule. Add an explicit
    // allow-list before applying if the nodes need public SSH access.
    sshAllowedCidrs: listEnv('SSH_ALLOWED_CIDRS'),
    publicTcpPorts: portListEnv('FIREWALL_PUBLIC_TCP_PORTS'),
    serverCount: integerEnv('SERVER_COUNT', 1, 0),
    serverType: env('SERVER_TYPE', 'cpx11')!,
    location: env('LOCATION', 'fsn1')!,
    image: env('IMAGE', 'ubuntu-24.04')!,
    loadBalancerEnabled,
    loadBalancerType: env('LOAD_BALANCER_TYPE', 'lb11')!,
    loadBalancerPorts,
    loadBalancerDestinationPorts,
  };
}

class HetznerStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: HetznerConfig) {
    super(scope, id);

    new HcloudProvider(this, 'hcloud', { token: config.token });

    const sshKey = config.sshPublicKey
      ? new SshKey(this, 'ssh-key', {
          name: config.sshKeyName,
          publicKey: config.sshPublicKey,
          labels: { managed_by: 'cdktf' },
        })
      : undefined;

    const network = new Network(this, 'private-network', {
      name: `${config.namePrefix}-network`,
      ipRange: config.networkCidr,
      labels: { managed_by: 'cdktf' },
    });

    const subnet = new NetworkSubnet(this, 'private-subnet', {
      networkId: Token.asNumber(network.id),
      type: 'cloud',
      networkZone: config.networkZone,
      ipRange: config.subnetCidr,
    });

    let firewall: Firewall | undefined;
    if (config.firewallEnabled) {
      const rules: FirewallRule[] = [
        {
          direction: 'in',
          protocol: 'tcp',
          port: 'any',
          sourceIps: [config.networkCidr],
          description: 'Private network TCP traffic',
        },
        {
          direction: 'in',
          protocol: 'udp',
          port: 'any',
          sourceIps: [config.networkCidr],
          description: 'Private network UDP traffic',
        },
        {
          direction: 'in',
          protocol: 'icmp',
          sourceIps: [config.networkCidr],
          description: 'Private network ICMP traffic',
        },
      ];

      if (config.sshAllowedCidrs.length > 0) {
        rules.push({
          direction: 'in',
          protocol: 'tcp',
          port: '22',
          sourceIps: config.sshAllowedCidrs,
          description: 'SSH from the configured allow-list',
        });
      }

      for (const port of config.publicTcpPorts) {
        rules.push({
          direction: 'in',
          protocol: 'tcp',
          port: String(port),
          sourceIps: ['0.0.0.0/0', '::/0'],
          description: `Public TCP port ${port}`,
        });
      }

      firewall = new Firewall(this, 'firewall', {
        name: config.firewallName,
        labels: { managed_by: 'cdktf' },
        rule: rules,
      });
    }

    const servers: Server[] = [];
    for (let index = 0; index < config.serverCount; index += 1) {
      const server = new Server(this, `server-${index + 1}`, {
        name: `${config.namePrefix}-node-${index + 1}`,
        serverType: config.serverType,
        location: config.location,
        image: config.image,
        sshKeys: sshKey ? [sshKey.id] : undefined,
        firewallIds: firewall ? [Token.asNumber(firewall.id)] : undefined,
        labels: {
          role: 'node',
          managed_by: 'cdktf',
        },
        publicNet: [{ ipv4Enabled: true, ipv6Enabled: true }],
        network: [{ networkId: Token.asNumber(network.id) }],
      });
      // The provider only infers the network dependency from the network ID;
      // explicitly wait for the subnet so placement is deterministic.
      server.addOverride('depends_on', [`hcloud_network_subnet.${subnet.friendlyUniqueId}`]);
      servers.push(server);
    }

    new TerraformOutput(this, 'network-id', {
      value: network.id,
      description: 'ID of the private network',
    });
    new TerraformOutput(this, 'server-ids', {
      value: servers.map(server => server.id),
      description: 'IDs of the provisioned servers',
    });

    if (config.loadBalancerEnabled) {
      const loadBalancer = new LoadBalancer(this, 'load-balancer', {
        name: `${config.namePrefix}-load-balancer`,
        loadBalancerType: config.loadBalancerType,
        location: config.location,
        labels: { managed_by: 'cdktf' },
      });

      const loadBalancerNetwork = new LoadBalancerNetwork(this, 'load-balancer-network', {
        loadBalancerId: Token.asNumber(loadBalancer.id),
        networkId: Token.asNumber(network.id),
      });
      loadBalancerNetwork.addOverride('depends_on', [
        `hcloud_network_subnet.${subnet.friendlyUniqueId}`,
      ]);

      for (let index = 0; index < servers.length; index += 1) {
        const target = new LoadBalancerTargetA(this, `load-balancer-target-${index + 1}`, {
          loadBalancerId: Token.asNumber(loadBalancer.id),
          type: 'server',
          serverId: Token.asNumber(servers[index].id),
          usePrivateIp: true,
        });
        target.addOverride('depends_on', [
          `hcloud_load_balancer_network.${loadBalancerNetwork.friendlyUniqueId}`,
        ]);
      }

      for (let index = 0; index < config.loadBalancerPorts.length; index += 1) {
        const listenPort = config.loadBalancerPorts[index];
        const destinationPort = config.loadBalancerDestinationPorts[index];
        new LoadBalancerService(this, `load-balancer-service-${listenPort}`, {
          loadBalancerId: loadBalancer.id,
          protocol: 'tcp',
          listenPort,
          destinationPort,
          healthCheck: {
            protocol: 'tcp',
            port: destinationPort,
            interval: 15,
            timeout: 10,
            retries: 3,
          },
        });
      }

      new TerraformOutput(this, 'load-balancer-ipv4', {
        value: loadBalancer.ipv4,
        description: 'Public IPv4 address of the optional load balancer',
      });
      new TerraformOutput(this, 'load-balancer-ipv6', {
        value: loadBalancer.ipv6,
        description: 'Public IPv6 address of the optional load balancer',
      });
    }
  }
}

const app = new App();
new HetznerStack(app, 'hetzner', loadConfig());
app.synth();
