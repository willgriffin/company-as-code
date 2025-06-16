import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { KubernetesCluster } from '@cdktf/provider-digitalocean/lib/kubernetes-cluster';
import { KubernetesNodePool } from '@cdktf/provider-digitalocean/lib/kubernetes-node-pool';
import { Config, Environment } from '@startup-gitops/shared';

export interface DigitalOceanClusterStackProps {
  projectName: string;
  environment: Environment;
  config: Config;
}

export class DigitalOceanClusterStack extends TerraformStack {
  public readonly cluster: KubernetesCluster;
  public readonly nodePool: KubernetesNodePool;

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
      },
      tags: [
        projectName,
        environment.name,
        'managed-by-cdktf'
      ]
    });

    // Outputs
    new TerraformOutput(this, 'cluster_id', {
      value: this.cluster.id,
      description: 'The ID of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'cluster_endpoint', {
      value: this.cluster.endpoint,
      description: 'The endpoint of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'cluster_status', {
      value: this.cluster.status,
      description: 'The status of the Kubernetes cluster'
    });

    new TerraformOutput(this, 'kubeconfig', {
      value: this.cluster.kubeConfig,
      sensitive: true,
      description: 'The kubeconfig for the cluster'
    });
  }
}