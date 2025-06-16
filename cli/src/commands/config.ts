import { existsSync, writeFileSync, readFileSync } from 'fs';
import chalk from 'chalk';
import { validateConfig, Config } from '@startup-gitops/platform';

interface ConfigValidateOptions {
  config?: string;
}

interface ConfigInitOptions {
  output?: string;
}

async function validate(options: ConfigValidateOptions): Promise<void> {
  const configPath = options.config || 'gitops.config.json';
  
  try {
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    const validatedConfig = validateConfig(config);
    
    console.log(chalk.green('✅ Configuration is valid!'));
    console.log(chalk.yellow('\n📋 Configuration Summary:'));
    console.log(chalk.gray(`  Project: ${validatedConfig.project.name}`));
    console.log(chalk.gray(`  Domain: ${validatedConfig.project.domain}`));
    console.log(chalk.gray(`  Environments: ${validatedConfig.environments.length}`));
    console.log(chalk.gray(`  Applications: ${validatedConfig.applications.length}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Configuration validation failed:'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}

async function init(options: ConfigInitOptions): Promise<void> {
  const outputPath = options.output || 'gitops.config.json';
  
  if (existsSync(outputPath)) {
    console.log(chalk.yellow(`⚠️  Configuration file already exists: ${outputPath}`));
    return;
  }

  const exampleConfig: Config = {
    project: {
      name: 'my-gitops-project',
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
    applications: ['keycloak', 'mattermost']
  };

  writeFileSync(outputPath, JSON.stringify(exampleConfig, null, 2));
  
  console.log(chalk.green(`✅ Example configuration created: ${outputPath}`));
  console.log(chalk.yellow('\nNext steps:'));
  console.log(chalk.gray('  1. Edit the configuration file with your values'));
  console.log(chalk.gray('  2. Run: gitops-cli config validate'));
  console.log(chalk.gray('  3. Run: gitops-cli init --config ' + outputPath));
}

export const config = {
  validate,
  init
};