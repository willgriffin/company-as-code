import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { KubernetesProvider } from '@cdktf/provider-kubernetes/lib/provider';
import { ConfigMapV1 } from '@cdktf/provider-kubernetes/lib/config-map-v1';
import { Null } from '@cdktf/provider-null/lib/provider';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { Config, Environment } from '../config/schema';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

export interface FluxConfigurationStackProps {
  projectName: string;
  environment: Environment;
  config: Config;
  kubeconfig: string;
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
    this.kubeconfig = kubeconfig;

    // Null provider for executing local commands
    new Null(this, 'null');

    // Kubernetes provider for creating ConfigMaps
    new KubernetesProvider(this, 'kubernetes', {
      configPath: kubeconfig
    });

    // Step 1: One-time static configuration
    this.configureStaticManifests();

    // Step 2: Dynamic infrastructure ConfigMap
    this.createInfrastructureConfigMap();

    // Output information about the configuration
    new TerraformOutput(this, 'configuration_status', {
      value: 'Static manifests configured and infrastructure ConfigMap created',
      description: 'Status of Flux configuration setup'
    });
  }

  private configureStaticManifests(): void {
    // Define the static replacements to perform
    const replacements = {
      'example.com': this.config.project.domain,
      'example-project': this.config.project.name,
      'example-cluster': `${this.config.project.name}-${this.environment.name}`,
      'my-cluster': `${this.config.project.name}-${this.environment.name}`,
      'admin@example.com': this.config.project.email,
      'nyc3.digitaloceanspaces.com': `${this.environment.cluster.region}.digitaloceanspaces.com`,
      'https://auth.example.com': `https://auth.${this.config.project.domain}`,
      'cloud.example.com': `cloud.${this.config.project.domain}`,
      'chat.example.com': `chat.${this.config.project.domain}`,
      'mail.example.com': `mail.${this.config.project.domain}`,
      'files.example.com': `files.${this.config.project.domain}`,
    };

    // Create a null resource that performs the one-time replacement
    new Resource(this, 'configure-static-manifests', {
      triggers: {
        // Trigger when config changes
        config_hash: this.generateConfigHash(),
        always_run: Date.now().toString() // Force run on every apply for now
      },
      provisioner: [{
        type: 'local-exec',
        command: this.generateReplacementScript(replacements)
      }]
    });
  }

  private generateReplacementScript(replacements: Record<string, string>): string {
    const fluxDir = path.resolve('..', 'flux');
    let script = `#!/bin/bash\nset -euo pipefail\n\n`;
    
    script += `echo "Configuring static Flux manifests..."\n`;
    script += `FLUX_DIR="${fluxDir}"\n\n`;
    
    // Check if flux directory exists
    script += `if [[ ! -d "$FLUX_DIR" ]]; then\n`;
    script += `  echo "Warning: Flux directory not found at $FLUX_DIR"\n`;
    script += `  exit 0\n`;
    script += `fi\n\n`;

    // Backup existing files first
    script += `echo "Creating backup of original manifests..."\n`;
    script += `if [[ ! -d "$FLUX_DIR/.backups" ]]; then\n`;
    script += `  mkdir -p "$FLUX_DIR/.backups"\n`;
    script += `  find "$FLUX_DIR" -name "*.yaml" -o -name "*.yml" | while read -r file; do\n`;
    script += `    relative_path=\${file#$FLUX_DIR/}\n`;
    script += `    backup_dir="$FLUX_DIR/.backups/$(dirname "$relative_path")"\n`;
    script += `    mkdir -p "$backup_dir"\n`;
    script += `    cp "$file" "$FLUX_DIR/.backups/$relative_path.orig"\n`;
    script += `  done\n`;
    script += `fi\n\n`;

    // Perform replacements
    script += `echo "Applying static configuration replacements..."\n`;
    for (const [from, to] of Object.entries(replacements)) {
      script += `find "$FLUX_DIR" -name "*.yaml" -o -name "*.yml" | xargs sed -i 's|${from}|${to}|g'\n`;
    }

    script += `echo "Static manifest configuration complete"\n`;
    
    return script;
  }

  private generateConfigHash(): string {
    // Generate a hash of the configuration to detect changes
    const configString = JSON.stringify({
      domain: this.config.project.domain,
      name: this.config.project.name,
      email: this.config.project.email,
      environment: this.environment.name,
      region: this.environment.cluster.region
    });
    
    return Buffer.from(configString).toString('base64').substring(0, 16);
  }

  private createInfrastructureConfigMap(): void {
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
        region: this.environment.cluster.region
      })
    };

    new ConfigMapV1(this, 'infrastructure-config', {
      metadata: {
        name: 'infrastructure-config',
        namespace: 'flux-system',
        labels: {
          'app.kubernetes.io/name': 'infrastructure-config',
          'app.kubernetes.io/part-of': 'flux-system',
          'app.kubernetes.io/managed-by': 'cdktf'
        }
      },
      data: configMapData
    });
  }

  private generateResourceProfiles(): Record<string, any> {
    const { nodeSize, nodeCount } = this.environment.cluster;
    
    // Base profiles that scale with cluster size
    const baseProfiles = {
      micro: { cpu: '100m', memory: '128Mi' },
      small: { cpu: '500m', memory: '512Mi' },
      medium: { cpu: '1000m', memory: '1Gi' },
      large: { cpu: '2000m', memory: '2Gi' },
      xlarge: { cpu: '4000m', memory: '4Gi' }
    };

    // Adjust profiles based on node configuration
    const memoryMultiplier = nodeSize.includes('4gb') ? 1 : 
                           nodeSize.includes('8gb') ? 2 : 
                           nodeSize.includes('16gb') ? 4 : 1;

    const scaledProfiles: Record<string, any> = {};
    for (const [profile, resources] of Object.entries(baseProfiles)) {
      scaledProfiles[profile] = {
        cpu: resources.cpu,
        memory: this.scaleMemory(resources.memory, memoryMultiplier)
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
          size: '10Gi'
        },
        bulk: {
          storageClass: 'do-block-storage',
          size: '100Gi'
        },
        backup: {
          storageClass: 'do-block-storage',
          size: '50Gi'
        }
      },
      region: region,
      backupRegion: region // Could be different for disaster recovery
    };
  }

  private generateNetworkingConfig(): Record<string, any> {
    return {
      loadBalancer: {
        size: this.environment.cluster.nodeCount >= 5 ? 'lb-medium' : 'lb-small',
        algorithm: 'round_robin'
      },
      ingress: {
        className: 'kong',
        annotations: {
          'cert-manager.io/cluster-issuer': 'letsencrypt-prod'
        }
      }
    };
  }

  private generateValuesYaml(config: any): string {
    return `# Infrastructure configuration generated by CDKTF
# This ConfigMap provides dynamic values for Flux manifests

resourceProfiles:
${Object.entries(config.resourceProfiles).map(([name, resources]: [string, any]) => 
  `  ${name}:\n    requests:\n      cpu: "${resources.cpu}"\n      memory: "${resources.memory}"\n    limits:\n      cpu: "${resources.cpu}"\n      memory: "${resources.memory}"`
).join('\n')}

storage:
${Object.entries(config.storageConfig.classes).map(([name, storage]: [string, any]) =>
  `  ${name}:\n    storageClass: "${storage.storageClass}"\n    size: "${storage.size}"`
).join('\n')}

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
}