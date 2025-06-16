import { App } from 'cdktf';
import { DigitalOceanClusterStack } from './stacks/digitalocean-cluster';
import { Config } from '@startup-gitops/shared';

// Load configuration (placeholder for now)
const config: Config = {
  project: {
    name: 'example-project',
    domain: 'example.com',
    email: 'admin@example.com'
  },
  environments: [{
    name: 'production',
    cluster: {
      region: 'nyc3',
      nodeSize: 's-2vcpu-4gb',
      nodeCount: 3
    },
    domain: 'example.com'
  }],
  features: {
    email: false,
    monitoring: true,
    backup: true,
    ssl: true
  },
  applications: []
};

const app = new App();

// Create stacks for each environment
config.environments.forEach(env => {
  new DigitalOceanClusterStack(app, `${config.project.name}-${env.name}`, {
    projectName: config.project.name,
    environment: env,
    config
  });
});

app.synth();