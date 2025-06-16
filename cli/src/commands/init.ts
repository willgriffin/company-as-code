import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { Config, validateConfig } from '@startup-gitops/shared';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface InitOptions {
  interactive?: boolean;
  config?: string;
}

export async function init(options: InitOptions) {
  console.log(chalk.blue.bold('🚀 GitOps Template Initialization'));
  console.log(chalk.gray('Setting up your GitOps deployment with Terraform CDK\n'));

  try {
    const config = options.interactive 
      ? await promptForConfig()
      : await loadConfigFile(options.config);

    // Validate configuration
    const validatedConfig = validateConfig(config);
    
    // Save configuration
    const configPath = options.config || 'gitops.config.json';
    writeFileSync(configPath, JSON.stringify(validatedConfig, null, 2));
    
    console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.gray('  1. Review your configuration'));
    console.log(chalk.gray('  2. Run: gitops-cli deploy'));
    console.log(chalk.gray('  3. Access your applications once deployment completes'));

  } catch (error) {
    console.error(chalk.red('❌ Initialization failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function promptForConfig(): Promise<Config> {
  console.log(chalk.yellow('📝 Interactive Configuration\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (lowercase, hyphens allowed):',
      validate: (input: string) => {
        if (!input.match(/^[a-z0-9-]+$/)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'projectDomain',
      message: 'Primary domain (e.g., example.com):',
      validate: (input: string) => {
        if (!input.match(/^[a-z0-9.-]+$/)) {
          return 'Invalid domain format';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'projectEmail',
      message: 'Admin email address:',
      validate: (input: string) => {
        if (!input.includes('@')) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'environment',
      message: 'Primary environment:',
      choices: ['production', 'staging']
    },
    {
      type: 'list',
      name: 'region',
      message: 'DigitalOcean region:',
      choices: [
        'nyc1', 'nyc3', 'ams3', 'sfo3', 
        'sgp1', 'lon1', 'fra1', 'tor1', 'blr1'
      ]
    },
    {
      type: 'list',
      name: 'nodeSize',
      message: 'Kubernetes node size:',
      choices: [
        { name: 's-2vcpu-2gb (Basic)', value: 's-2vcpu-2gb' },
        { name: 's-2vcpu-4gb (Recommended)', value: 's-2vcpu-4gb' },
        { name: 's-4vcpu-8gb (Performance)', value: 's-4vcpu-8gb' }
      ]
    },
    {
      type: 'number',
      name: 'nodeCount',
      message: 'Number of nodes:',
      default: 3,
      validate: (input: number) => input >= 1 && input <= 10
    },
    {
      type: 'checkbox',
      name: 'applications',
      message: 'Select applications to deploy:',
      choices: [
        { name: 'Keycloak (Identity Management)', value: 'keycloak' },
        { name: 'Mattermost (Team Collaboration)', value: 'mattermost' },
        { name: 'Nextcloud (File Storage)', value: 'nextcloud' },
        { name: 'Mailu (Email Server)', value: 'mailu' }
      ]
    },
    {
      type: 'confirm',
      name: 'enableEmail',
      message: 'Enable email functionality (AWS SES)?',
      default: false
    },
    {
      type: 'confirm',
      name: 'enableMonitoring',
      message: 'Enable monitoring and observability?',
      default: true
    }
  ]);

  return {
    project: {
      name: answers.projectName,
      domain: answers.projectDomain,
      email: answers.projectEmail
    },
    environments: [{
      name: answers.environment,
      cluster: {
        region: answers.region,
        nodeSize: answers.nodeSize,
        nodeCount: answers.nodeCount
      },
      domain: answers.projectDomain
    }],
    features: {
      email: answers.enableEmail,
      monitoring: answers.enableMonitoring,
      backup: true,
      ssl: true
    },
    applications: answers.applications || []
  };
}

async function loadConfigFile(configPath?: string): Promise<Config> {
  const path = configPath || 'gitops.config.json';
  
  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}`);
  }

  const configContent = await import(join(process.cwd(), path));
  return configContent.default || configContent;
}