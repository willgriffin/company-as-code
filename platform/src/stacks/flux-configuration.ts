import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, S3Backend, Fn } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { DataDigitaloceanKubernetesCluster } from '@cdktf/provider-digitalocean/lib/data-digitalocean-kubernetes-cluster';
import { KubernetesProvider } from '@cdktf/provider-kubernetes/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { Config, Environment } from '../config/schema';
// @ts-ignore - Generated CDKTF provider bindings
import { FluxProvider } from '../../.gen/providers/flux/provider';
// @ts-ignore - Generated CDKTF provider bindings
import { BootstrapGit } from '../../.gen/providers/flux/bootstrap-git';

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
    this.kubeconfig = kubeconfig || '';

    // Configure S3 backend for Terraform state
    new S3Backend(this, {
      bucket: process.env.TERRAFORM_STATE_BUCKET!,
      key: `${projectName}/${environment.name}-flux.tfstate`,
      region: process.env.TERRAFORM_STATE_REGION!,
      encrypt: true,
    });

    // DigitalOcean provider to fetch cluster data
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
    });

    // Null provider for local operations
    new NullProvider(this, 'null');

    // Fetch the cluster data using a data source
    const clusterName = `${projectName}-${environment.name}`;
    const clusterData = new DataDigitaloceanKubernetesCluster(this, 'cluster-data', {
      name: clusterName,
    });

    // Ensure correct cluster directory structure exists
    const directorySetup = new Resource(this, 'cluster-directory-setup', {
      provisioners: [
        {
          type: 'local-exec',
          command: `
          # Check if template directory exists and target doesn't
          if [ -d "../manifests/clusters/my-cluster" ] && [ ! -d "../manifests/clusters/${clusterName}" ]; then
            echo "Renaming template directory my-cluster to ${clusterName}"
            mv "../manifests/clusters/my-cluster" "../manifests/clusters/${clusterName}"
          elif [ ! -d "../manifests/clusters/${clusterName}" ]; then
            echo "Creating cluster directory ${clusterName}"
            mkdir -p "../manifests/clusters/${clusterName}"
          fi
        `,
        },
      ],
      triggers: {
        cluster_name: clusterName,
      },
    });

    // Configure Kubernetes provider using the cluster kubeconfig
    new KubernetesProvider(this, 'kubernetes', {
      configPath: undefined, // Don't use local kubeconfig file
      configContext: undefined,
      host: clusterData.endpoint,
      token: clusterData.kubeConfig.get(0).token,
      clusterCaCertificate: clusterData.kubeConfig.get(0).clusterCaCertificate,
    });

    // Configure Flux provider with Git repository settings
    new FluxProvider(this, 'flux', {
      kubernetes: {
        host: clusterData.endpoint,
        token: clusterData.kubeConfig.get(0).token,
        clusterCaCertificate: Fn.base64decode(clusterData.kubeConfig.get(0).clusterCaCertificate),
      },
      git: {
        url: 'https://github.com/happyvertical/iac',
        branch: 'main',
        authorName: 'Flux',
        authorEmail: this.config.project.email,
        http: {
          username: 'oauth2',
          password: process.env.GITHUB_TOKEN!,
        },
      },
    });

    // Configure manifests before bootstrapping Flux
    const manifestsConfig = new Resource(this, 'configure-manifests', {
      provisioners: [
        {
          type: 'local-exec',
          command: `
          # Create replacements file with config values
          cat > /tmp/replacements.json << EOF
{
  "support@example.com": "${this.config.project.email}",
  "example.com": "${this.config.project.domain}", 
  "example-cluster": "${clusterName}",
  "my-project": "${this.config.project.name}"
}
EOF

          # Run the configure-manifests script from repository root
          cd $(git rev-parse --show-toplevel)/platform && ./scripts/configure-manifests.sh ../manifests /tmp/replacements.json
        `,
        },
      ],
      triggers: {
        config_hash: JSON.stringify({
          email: this.config.project.email,
          domain: this.config.project.domain,
          clusterName: clusterName,
          projectName: this.config.project.name,
        }),
      },
      dependsOn: [directorySetup],
    });

    // Bootstrap Flux with Git repository
    const fluxBootstrap = new BootstrapGit(this, 'flux-bootstrap', {
      path: `manifests/clusters/${clusterName}`,
      namespace: 'flux-system',
      interval: '1m',
      version: 'v2.3.0',
      dependsOn: [clusterData, directorySetup, manifestsConfig],
    });

    new TerraformOutput(this, 'flux_status', {
      value: 'Flux bootstrapped successfully',
      description: 'Status of Flux bootstrap',
    });

    new TerraformOutput(this, 'flux_namespace', {
      value: fluxBootstrap.namespace,
      description: 'Namespace where Flux is installed',
    });
  }
}
