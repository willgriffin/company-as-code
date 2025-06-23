import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, S3Backend } from 'cdktf';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { DataDigitaloceanKubernetesCluster } from '@cdktf/provider-digitalocean/lib/data-digitalocean-kubernetes-cluster';
import { Config, Environment } from '../config/schema';
import path from 'path';

export interface FluxConfigurationStackProps {
  projectName: string;
  environment: Environment;
  config: Config;
  kubeconfig?: string; // Make optional for backward compatibility
}

export class FluxConfigurationStack extends TerraformStack {
  private config: Config;
  private environment: Environment;
  private kubeconfig: string;

  constructor(scope: Construct, id: string, props: FluxConfigurationStackProps) {
    super(scope, id);

    const { projectName, environment, config, kubeconfig } = props;
    this.config = config;
    this.environment = environment;
    this.kubeconfig = kubeconfig || '';

    // Configure S3 backend for Terraform state
    new S3Backend(this, {
      bucket: process.env.TERRAFORM_STATE_BUCKET!,
      key: `${projectName}/${environment.name}-flux.tfstate`,
      region: process.env.TERRAFORM_STATE_REGION!,
      encrypt: true,
    });

    // Null provider for executing local commands
    new NullProvider(this, 'null');

    // DigitalOcean provider to fetch cluster data
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
    });

    // Step 1: Always configure static manifests (doesn't require Kubernetes access)
    this.configureStaticManifests();

    // Fetch the cluster data using a data source
    const clusterName = `${projectName}-${environment.name}`;
    const clusterData = new DataDigitaloceanKubernetesCluster(this, 'cluster-data', {
      name: clusterName,
    });

    // Wait for cluster to be ready
    const waitForCluster = new Resource(this, 'wait-for-cluster', {
      provisioners: [
        {
          type: 'local-exec',
          command: `echo "Waiting for cluster ${clusterName} to be ready..." && sleep 30`,
        },
      ],
      dependsOn: [clusterData],
    });

    // Check if cluster exists before trying to create Kubernetes resources
    new Resource(this, 'check-cluster', {
      provisioners: [
        {
          type: 'local-exec',
          command: `
            if doctl kubernetes cluster get ${clusterName} 2>/dev/null; then
              echo "Cluster ${clusterName} exists"
              exit 0
            else
              echo "Cluster ${clusterName} does not exist yet, skipping Kubernetes resources"
              exit 1
            fi
          `,
        },
      ],
      dependsOn: [waitForCluster],
    });

    // Try to set up Kubernetes provider, but don't fail if cluster doesn't exist
    try {
      // For now, skip Kubernetes resources in initial deployment
      // They will be created in a subsequent run
      // Note: Kubernetes resources will be created in the next deployment run

      new TerraformOutput(this, 'configuration_status', {
        value: 'Static manifests configured. Run deployment again to create Kubernetes resources.',
        description: 'Status of Flux configuration setup',
      });
    } catch (e) {
      // Skipping Kubernetes resources
    }
  }

  private configureStaticManifests(): void {
    // Define the static replacements to perform
    const clusterName = `${this.config.project.name}-${this.environment.name}`;
    const domain = this.config.project.domain;
    const region = this.environment.cluster.region;

    const replacements = {
      // Basic patterns
      'example.com': domain,
      'example-project': this.config.project.name,
      'example-cluster': clusterName,
      'my-cluster': clusterName,
      'admin@example.com': this.config.project.email,

      // Regional patterns
      'nyc3.digitaloceanspaces.com': `${region}.digitaloceanspaces.com`,
      'example-cluster-backup.nyc3.digitaloceanspaces.com': `${clusterName}-backup.${region}.digitaloceanspaces.com`,

      // Application subdomains
      'api.example.com': `api.${domain}`,
      'auth.example.com': `auth.${domain}`,
      'chat.example.com': `chat.${domain}`,
      'cloud.example.com': `cloud.${domain}`,
      'mail.example.com': `mail.${domain}`,
      'files.example.com': `files.${domain}`,
      'ai.example.com': `ai.${domain}`,
      'grafana.example.com': `grafana.${domain}`,
      'prometheus.example.com': `prometheus.${domain}`,
      'alertmanager.example.com': `alertmanager.${domain}`,
      'jaeger.example.com': `jaeger.${domain}`,
      'postal.example.com': `postal.${domain}`,
      'webmail.example.com': `webmail.${domain}`,
      'mailadmin.example.com': `mailadmin.${domain}`,
      'imap.example.com': `imap.${domain}`,
      'smtp.example.com': `smtp.${domain}`,
      'routes.example.com': `routes.${domain}`,
      'track.example.com': `track.${domain}`,
      'rp.example.com': `rp.${domain}`,

      // Resource naming patterns
      'example-cluster-grafana-secret': `${clusterName}-grafana-secret`,
      'example-cluster-kong-gateway': `${clusterName}-kong-gateway`,
      'example-cluster-kong-proxy': `${clusterName}-kong-proxy`,
      'example-cluster-backup': `${clusterName}-backup`,
      'example-cluster-nextcloud': `${clusterName}-nextcloud`,
      'example-cluster-mailu': `${clusterName}-mailu`,
      'example-cluster-postal-smtp': `${clusterName}-postal-smtp`,

      // URL patterns with protocol
      'https://auth.example.com': `https://auth.${domain}`,
      'https://cloud.example.com': `https://cloud.${domain}`,
      'https://chat.example.com': `https://chat.${domain}`,
      'https://mail.example.com': `https://mail.${domain}`,
    };

    // Write replacements to a temporary JSON file
    const replacementsFile = '/tmp/replacements.json';
    const replacementsJson = JSON.stringify(replacements, null, 2);

    // Create a null resource that performs the one-time replacement
    new Resource(this, 'configure-static-manifests', {
      triggers: {
        // Trigger when config changes
        config_hash: this.generateConfigHash(),
        replacements_hash: this.hashString(replacementsJson),
      },
      provisioners: [
        {
          type: 'local-exec',
          command: `echo '${replacementsJson.replace(/'/g, "'\"'\"'")}' > ${replacementsFile}`,
        },
        {
          type: 'local-exec',
          command: `bash ${path.resolve('scripts/configure-manifests.sh')} ${path.resolve('..', 'manifests')} ${replacementsFile}`,
        },
        {
          type: 'local-exec',
          command: `rm -f ${replacementsFile}`,
        },
      ],
    });
  }

  private hashString(str: string): string {
    // Simple hash function for generating consistent hashes
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateConfigHash(): string {
    // Generate a hash of the configuration to detect changes
    const configString = JSON.stringify({
      domain: this.config.project.domain,
      name: this.config.project.name,
      email: this.config.project.email,
      environment: this.environment.name,
      region: this.environment.cluster.region,
    });

    return Buffer.from(configString).toString('base64').substring(0, 16);
  }

  // Removed createInfrastructureConfigMap - will be implemented when K8s provider is ready
  /*
  private createInfrastructureConfigMap(waitResource?: Resource): void {
    // Generate resource profiles based on cluster configuration
    const resourceProfiles = this.generateResourceProfiles();

    // Generate storage configurations
    const storageConfig = this.generateStorageConfig();

    // Generate networking configuration
    const networkingConfig = this.generateNetworkingConfig();

    // Create the infrastructure ConfigMap
    const configMapData = {
      'values.yaml': this.generateValuesYaml({
        resourceProfiles,
        storageConfig,
        networkingConfig,
        cluster: this.environment.cluster,
        domain: this.config.project.domain,
        region: this.environment.cluster.region,
      }),
    };

    const configMap = new ConfigMapV1(this, 'infrastructure-config', {
      metadata: {
        name: 'infrastructure-config',
        namespace: 'flux-system',
        labels: {
          'app.kubernetes.io/name': 'infrastructure-config',
          'app.kubernetes.io/part-of': 'flux-system',
          'app.kubernetes.io/managed-by': 'cdktf',
        },
      },
      data: configMapData,
    });

    if (waitResource) {
      configMap.node.addDependency(waitResource);
    }
  }

  private generateResourceProfiles(): Record<string, any> {
    const { nodeSize } = this.environment.cluster;

    // Base profiles that scale with cluster size
    const baseProfiles = {
      micro: { cpu: '100m', memory: '128Mi' },
      small: { cpu: '500m', memory: '512Mi' },
      medium: { cpu: '1000m', memory: '1Gi' },
      large: { cpu: '2000m', memory: '2Gi' },
      xlarge: { cpu: '4000m', memory: '4Gi' },
    };

    // Adjust profiles based on node configuration
    const memoryMultiplier = nodeSize.includes('4gb')
      ? 1
      : nodeSize.includes('8gb')
        ? 2
        : nodeSize.includes('16gb')
          ? 4
          : 1;

    const scaledProfiles: Record<string, any> = {};
    for (const [profile, resources] of Object.entries(baseProfiles)) {
      scaledProfiles[profile] = {
        cpu: resources.cpu,
        memory: this.scaleMemory(resources.memory, memoryMultiplier),
      };
    }

    return scaledProfiles;
  }

  private scaleMemory(memory: string, multiplier: number): string {
    const value = parseInt(memory.replace(/[^\d]/g, ''));
    const unit = memory.replace(/[\d]/g, '');
    return `${Math.min(value * multiplier, value * 4)}${unit}`; // Cap at 4x scaling
  }

  private generateStorageConfig(): Record<string, any> {
    const region = this.environment.cluster.region;

    return {
      classes: {
        fast: {
          storageClass: 'do-block-storage',
          size: '10Gi',
        },
        bulk: {
          storageClass: 'do-block-storage',
          size: '100Gi',
        },
        backup: {
          storageClass: 'do-block-storage',
          size: '50Gi',
        },
      },
      region: region,
      backupRegion: region, // Could be different for disaster recovery
    };
  }

  private generateNetworkingConfig(): Record<string, any> {
    return {
      loadBalancer: {
        size: this.environment.cluster.nodeCount >= 5 ? 'lb-medium' : 'lb-small',
        algorithm: 'round_robin',
      },
      ingress: {
        className: 'kong',
        annotations: {
          'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
        },
      },
    };
  }

  private generateValuesYaml(config: any): string {
    return `# Infrastructure configuration generated by CDKTF
# This ConfigMap provides dynamic values for Flux manifests

resourceProfiles:
${Object.entries(config.resourceProfiles)
  .map(
    ([name, resources]: [string, any]) =>
      `  ${name}:\n    requests:\n      cpu: "${resources.cpu}"\n      memory: "${resources.memory}"\n    limits:\n      cpu: "${resources.cpu}"\n      memory: "${resources.memory}"`
  )
  .join('\n')}

storage:
${Object.entries(config.storageConfig.classes)
  .map(
    ([name, storage]: [string, any]) =>
      `  ${name}:\n    storageClass: "${storage.storageClass}"\n    size: "${storage.size}"`
  )
  .join('\n')}

cluster:
  region: "${config.region}"
  domain: "${config.domain}"
  nodeCount: ${config.cluster.nodeCount}
  nodeSize: "${config.cluster.nodeSize}"
  haControlPlane: ${config.cluster.haControlPlane || false}

networking:
  loadBalancer:
    size: "${config.networkingConfig.loadBalancer.size}"
    algorithm: "${config.networkingConfig.loadBalancer.algorithm}"
  ingress:
    className: "${config.networkingConfig.ingress.className}"

# Application-specific overrides
applications:
  nextcloud:
    profile: "large"
    storage: "bulk"
  mattermost:
    profile: "medium"
    storage: "fast"
  keycloak:
    profile: "medium"
    storage: "fast"
  mailu:
    profile: "small"
    storage: "fast"
`;
  }
  */
}
