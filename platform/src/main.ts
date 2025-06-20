import { App } from 'cdktf';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DigitalOceanClusterStack } from './stacks/digitalocean-cluster';
import { DigitalOceanSpacesStack } from './stacks/digitalocean-spaces';
import { AWSSESStack } from './stacks/aws-ses';
import { GitHubSecretsStack } from './stacks/github-secrets';
import { FluxConfigurationStack } from './stacks/flux-configuration';
import { Config, validateConfig } from './config/schema';

function loadConfig(): Config {
  // Try to load configuration from various locations
  const configPaths = [
    'config.json',
    'config.js',
    'config.ts',
    '../config.json',
    '../config.js',
    '../config.ts',
    '../../config.json',
    '../../config.js',
    '../../config.ts',
    process.env.GITOPS_CONFIG_PATH,
  ].filter(Boolean);

  for (const configPath of configPaths) {
    if (configPath && existsSync(configPath)) {
      if (configPath.endsWith('.json')) {
        const configContent = readFileSync(configPath, 'utf-8');
        const rawConfig = JSON.parse(configContent);
        return validateConfig(rawConfig);
      } else if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {
        // For JS/TS files, we expect a default export or module.exports
        delete require.cache[require.resolve(join(process.cwd(), configPath))];
        const rawConfig = require(join(process.cwd(), configPath));
        return validateConfig(rawConfig.default || rawConfig);
      }
    }
  }

  // Fallback to example configuration
  console.warn('No configuration file found, using example configuration');
  return {
    project: {
      name: 'example-project',
      domain: 'example.com',
      email: 'admin@example.com',
    },
    environments: [
      {
        name: 'production',
        cluster: {
          region: 'nyc3',
          nodeSize: 's-2vcpu-4gb',
          nodeCount: 3,
          haControlPlane: false,
        },
        domain: 'example.com',
      },
    ],
  };
}

const config = loadConfig();
const app = new App();

// Create shared infrastructure first
// Note: S3 bucket for Terraform state is created by setup.ts as a prerequisite
// Spaces bucket for application storage
new DigitalOceanSpacesStack(app, `${config.project.name}-spaces`, {
  projectName: config.project.name,
  config,
  region: config.environments[0].cluster.region,
});

// Create SES stack for email functionality
const sesStack = new AWSSESStack(app, `${config.project.name}-ses`, {
  projectName: config.project.name,
  config,
});

// Create stacks for each environment
const clusterStacks = config.environments.map(env => {
  return new DigitalOceanClusterStack(app, `${config.project.name}-${env.name}`, {
    projectName: config.project.name,
    environment: env,
    config,
  });
});

// Create Flux configuration stacks for each environment
const fluxStacks = clusterStacks.map((clusterStack, index) => {
  const env = config.environments[index];
  const fluxStack = new FluxConfigurationStack(app, `${config.project.name}-${env.name}-flux`, {
    projectName: config.project.name,
    environment: env,
    config,
    kubeconfig: clusterStack.cluster.kubeConfig.get(0).rawConfig,
  });
  
  // Add dependency - flux stack waits for cluster stack to complete
  fluxStack.addDependency(clusterStack);
  
  return fluxStack;
});

// Create GitHub secrets stack if repository is configured
if (process.env.GITHUB_REPOSITORY) {
  const primaryCluster = clusterStacks[0];

  const secrets = GitHubSecretsStack.createSecretsMap({
    kubeconfig: primaryCluster.cluster.kubeConfig.get(0).rawConfig,
    digitalOceanToken: process.env.DIGITALOCEAN_TOKEN!,
    terraformStateBucket: process.env.TERRAFORM_STATE_BUCKET!,
    terraformStateRegion: process.env.TERRAFORM_STATE_REGION!,
    awsAccessKey: sesStack ? process.env.AWS_ACCESS_KEY_ID : undefined,
    awsSecretKey: sesStack ? process.env.AWS_SECRET_ACCESS_KEY : undefined,
    sesSmtpUsername: sesStack ? sesStack.accessKey.id : undefined,
    sesSmtpPassword: sesStack ? sesStack.accessKey.sesSmtpPasswordV4 : undefined,
  });

  const githubSecretsStack = new GitHubSecretsStack(app, `${config.project.name}-github-secrets`, {
    projectName: config.project.name,
    config,
    repository: process.env.GITHUB_REPOSITORY,
    secrets,
  });

  // GitHub secrets depend on cluster being created first
  githubSecretsStack.addDependency(primaryCluster);
  
  // GitHub secrets also depend on SES if it exists
  if (sesStack) {
    githubSecretsStack.addDependency(sesStack);
  }
}

app.synth();
