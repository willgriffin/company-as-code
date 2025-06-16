import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { KubernetesCluster } from '@cdktf/provider-digitalocean/lib/kubernetes-cluster';
import { KubernetesNodePool } from '@cdktf/provider-digitalocean/lib/kubernetes-node-pool';
import { LoadBalancer } from '@cdktf/provider-digitalocean/lib/loadbalancer';
import { Domain } from '@cdktf/provider-digitalocean/lib/domain';
import { Record } from '@cdktf/provider-digitalocean/lib/record';
import { Config, Environment } from '@startup-gitops/shared';

export interface DigitalOceanClusterStackProps {
  projectName: string;
  environment: Environment;
  config: Config;
}

export class DigitalOceanClusterStack extends TerraformStack {
  public readonly cluster: KubernetesCluster;
  public readonly nodePool: KubernetesNodePool;
  public readonly loadBalancer: LoadBalancer;
  public readonly domain: Domain;

  constructor(scope: Construct, id: string, props: DigitalOceanClusterStackProps) {
    super(scope, id);

    const { projectName, environment, config } = props;
    const clusterName = `${projectName}-${environment.name}`;

    // DigitalOcean provider
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
    });

    // Kubernetes cluster
    this.cluster = new KubernetesCluster(this, 'cluster', {
      name: clusterName,
      region: environment.cluster.region,
      version: environment.cluster.version || 'latest',
      nodePool: {
        name: `${clusterName}-default-pool`,
        size: environment.cluster.nodeSize,
        nodeCount: environment.cluster.nodeCount,
        autoScale: true,
        minNodes: Math.max(1, environment.cluster.nodeCount - 1),
        maxNodes: environment.cluster.nodeCount + 2,
      },
      tags: [
        projectName,
        environment.name,
        'managed-by-cdktf'
      ],
      maintenancePolicy: {
        startTime: '04:00',
        day: 'sunday'
      },
      ha: environment.name === 'production'
    });

    // Additional node pool for applications (if more than 2 nodes)
    if (environment.cluster.nodeCount > 2) {
      this.nodePool = new KubernetesNodePool(this, 'app-pool', {
        clusterId: this.cluster.id,
        name: `${clusterName}-app-pool`,
        size: environment.cluster.nodeSize,
        nodeCount: Math.max(1, environment.cluster.nodeCount - 1),
        autoScale: true,
        minNodes: 1,
        maxNodes: environment.cluster.nodeCount,
        tags: [
          projectName,
          environment.name,
          'app-workloads'
        ],
        labels: {
          'node-type': 'application',
          'environment': environment.name
        },
        taints: [{
          key: 'workload-type',
          value: 'application',
          effect: 'NoSchedule'
        }]
      });
    }

    // Load balancer for ingress
    this.loadBalancer = new LoadBalancer(this, 'ingress-lb', {
      name: `${clusterName}-ingress`,
      type: 'lb',
      region: environment.cluster.region,
      size: 'lb-small',
      algorithm: 'round_robin',
      forwardingRule: [
        {
          entryProtocol: 'http',
          entryPort: 80,
          targetProtocol: 'http',
          targetPort: 80
        },
        {
          entryProtocol: 'https',
          entryPort: 443,
          targetProtocol: 'https',
          targetPort: 443,
          certificateId: '', // Will be updated with cert-manager
        }
      ],
      healthcheck: {
        protocol: 'http',
        port: 80,
        path: '/healthz',
        checkIntervalSeconds: 10,
        responseTimeoutSeconds: 5,
        unhealthyThreshold: 3,
        healthyThreshold: 2
      },
      dropletTag: `${clusterName}-worker`
    });

    // Domain management
    this.domain = new Domain(this, 'domain', {
      name: environment.domain,
      ipAddress: this.loadBalancer.ip
    });

    // DNS records for applications
    const appSubdomains = config.applications.map(app => {
      switch (app) {
        case 'keycloak': return 'auth';
        case 'mattermost': return 'chat';
        case 'nextcloud': return 'files';
        case 'mailu': return 'mail';
        default: return app;
      }
    });

    appSubdomains.forEach(subdomain => {
      new Record(this, `record-${subdomain}`, {
        domain: this.domain.name,
        type: 'A',
        name: subdomain,
        value: this.loadBalancer.ip,
        ttl: 300
      });
    });

    // Wildcard record for additional services
    new Record(this, 'wildcard-record', {
      domain: this.domain.name,
      type: 'A',
      name: '*',
      value: this.loadBalancer.ip,
      ttl: 300
    });

    // Outputs
    new TerraformOutput(this, 'cluster_id', {
      value: this.cluster.id,
      description: 'The ID of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'cluster_name', {
      value: this.cluster.name,
      description: 'The name of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'cluster_endpoint', {
      value: this.cluster.endpoint,
      description: 'The endpoint of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'cluster_status', {
      value: this.cluster.status,
      description: 'The status of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'cluster_region', {
      value: this.cluster.region,
      description: 'The region of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'kubeconfig', {
      value: this.cluster.kubeConfig,
      sensitive: true,
      description: 'The kubeconfig for the cluster'
    });

    new TerraformOutput(this, 'load_balancer_ip', {
      value: this.loadBalancer.ip,
      description: 'The IP address of the load balancer'
    });

    new TerraformOutput(this, 'domain_name', {
      value: this.domain.name,
      description: 'The configured domain name'
    });

    new TerraformOutput(this, 'application_urls', {
      value: appSubdomains.map(sub => `https://${sub}.${environment.domain}`),
      description: 'URLs for deployed applications'
    });
  }
}