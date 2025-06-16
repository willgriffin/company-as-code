import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { Config, validateConfig } from '@startup-gitops/shared';
import { DigitalOceanProvider } from '../providers/digitalocean';
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

  // First, get DigitalOcean token if available for dynamic options
  let doProvider: DigitalOceanProvider | null = null;
  if (process.env.DIGITALOCEAN_TOKEN) {
    try {
      doProvider = new DigitalOceanProvider(process.env.DIGITALOCEAN_TOKEN);
      console.log(chalk.green('✅ DigitalOcean API access confirmed\n'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Using static options (DigitalOcean API not accessible)\n'));
    }
  } else {
    console.log(chalk.yellow('💡 Set DIGITALOCEAN_TOKEN environment variable for dynamic options\n'));
  }

  // Dynamic region fetching
  let regionChoices: Array<{name: string, value: string}> = [];
  if (doProvider) {
    const spinner = ora('Fetching available regions...').start();
    try {
      const regions = await doProvider.listRegions();
      regionChoices = regions.map(r => ({
        name: `${r.name} (${r.slug})`,
        value: r.slug
      }));
      spinner.succeed('Regions loaded');
    } catch (error) {
      spinner.warn('Using default regions');
      regionChoices = [
        { name: 'New York 1 (nyc1)', value: 'nyc1' },
        { name: 'New York 3 (nyc3)', value: 'nyc3' },
        { name: 'Amsterdam 3 (ams3)', value: 'ams3' },
        { name: 'San Francisco 3 (sfo3)', value: 'sfo3' },
        { name: 'Singapore 1 (sgp1)', value: 'sgp1' },
        { name: 'London 1 (lon1)', value: 'lon1' },
        { name: 'Frankfurt 1 (fra1)', value: 'fra1' },
        { name: 'Toronto 1 (tor1)', value: 'tor1' },
        { name: 'Bangalore 1 (blr1)', value: 'blr1' }
      ];
    }
  } else {
    regionChoices = [
      { name: 'New York 1 (nyc1)', value: 'nyc1' },
      { name: 'New York 3 (nyc3)', value: 'nyc3' },
      { name: 'Amsterdam 3 (ams3)', value: 'ams3' },
      { name: 'San Francisco 3 (sfo3)', value: 'sfo3' },
      { name: 'Singapore 1 (sgp1)', value: 'sgp1' },
      { name: 'London 1 (lon1)', value: 'lon1' },
      { name: 'Frankfurt 1 (fra1)', value: 'fra1' },
      { name: 'Toronto 1 (tor1)', value: 'tor1' },
      { name: 'Bangalore 1 (blr1)', value: 'blr1' }
    ];
  }

  // Dynamic node size fetching
  let nodeSizeChoices: Array<{name: string, value: string}> = [];
  if (doProvider) {
    const spinner = ora('Fetching available node sizes...').start();
    try {
      const sizes = await doProvider.listNodeSizes();
      nodeSizeChoices = sizes
        .filter(s => s.slug.includes('vcpu') && s.memory >= 2048) // Filter relevant sizes
        .map(s => ({
          name: `${s.slug} (${s.vcpus} vCPU, ${s.memory/1024}GB RAM, ${s.disk}GB SSD)`,
          value: s.slug
        }))
        .slice(0, 8); // Limit choices
      spinner.succeed('Node sizes loaded');
    } catch (error) {
      spinner.warn('Using default node sizes');
      nodeSizeChoices = [
        { name: 's-2vcpu-2gb (Basic - 2 vCPU, 2GB RAM)', value: 's-2vcpu-2gb' },
        { name: 's-2vcpu-4gb (Recommended - 2 vCPU, 4GB RAM)', value: 's-2vcpu-4gb' },
        { name: 's-4vcpu-8gb (Performance - 4 vCPU, 8GB RAM)', value: 's-4vcpu-8gb' },
        { name: 's-8vcpu-16gb (High Performance - 8 vCPU, 16GB RAM)', value: 's-8vcpu-16gb' }
      ];
    }
  } else {
    nodeSizeChoices = [
      { name: 's-2vcpu-2gb (Basic - 2 vCPU, 2GB RAM)', value: 's-2vcpu-2gb' },
      { name: 's-2vcpu-4gb (Recommended - 2 vCPU, 4GB RAM)', value: 's-2vcpu-4gb' },
      { name: 's-4vcpu-8gb (Performance - 4 vCPU, 8GB RAM)', value: 's-4vcpu-8gb' },
      { name: 's-8vcpu-16gb (High Performance - 8 vCPU, 16GB RAM)', value: 's-8vcpu-16gb' }
    ];
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (lowercase, hyphens allowed):',
      validate: (input: string) => {
        if (!input.match(/^[a-z0-9-]+$/)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        if (input.length < 3 || input.length > 50) {
          return 'Project name must be between 3 and 50 characters';
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
        if (!input.includes('.')) {
          return 'Domain must include a TLD (e.g., .com, .org)';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'projectEmail',
      message: 'Admin email address:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Project description (optional):',
      default: ''
    },
    {
      type: 'list',
      name: 'environment',
      message: 'Primary environment:',
      choices: [
        { name: 'Production (recommended for live deployments)', value: 'production' },
        { name: 'Staging (for testing and development)', value: 'staging' }
      ],
      default: 'production'
    },
    {
      type: 'list',
      name: 'region',
      message: 'DigitalOcean region:',
      choices: regionChoices,
      default: 'nyc3'
    },
    {
      type: 'list',
      name: 'nodeSize',
      message: 'Kubernetes node size:',
      choices: nodeSizeChoices,
      default: 's-2vcpu-4gb'
    },
    {
      type: 'number',
      name: 'nodeCount',
      message: 'Number of nodes:',
      default: 3,
      validate: (input: number) => {
        if (input < 1 || input > 20) {
          return 'Node count must be between 1 and 20';
        }
        if (input === 2) {
          return 'Consider using 1 or 3+ nodes for better availability';
        }
        return true;
      }
    },
    {
      type: 'checkbox',
      name: 'applications',
      message: 'Select applications to deploy:',
      choices: [
        { name: '🔐 Keycloak (Identity & Access Management)', value: 'keycloak' },
        { name: '💬 Mattermost (Team Collaboration & Chat)', value: 'mattermost' },
        { name: '☁️  Nextcloud (File Storage & Office Suite)', value: 'nextcloud' },
        { name: '📧 Mailu (Complete Email Server)', value: 'mailu' }
      ]
    },
    {
      type: 'confirm',
      name: 'enableEmail',
      message: 'Enable email functionality (AWS SES integration)?',
      default: false,
      when: (answers) => answers.applications.includes('mailu') || answers.applications.length > 0
    },
    {
      type: 'confirm',
      name: 'enableMonitoring',
      message: 'Enable monitoring and observability (Prometheus, Grafana)?',
      default: true
    },
    {
      type: 'confirm',
      name: 'enableBackup',
      message: 'Enable automated backups (Velero with DigitalOcean Spaces)?',
      default: true
    },
    {
      type: 'confirm',
      name: 'highAvailability',
      message: 'Enable high availability features (for production)?',
      default: (answers) => answers.environment === 'production' && answers.nodeCount >= 3,
      when: (answers) => answers.environment === 'production'
    }
  ]);

  // Generate additional environment if requested
  const environments = [{
    name: answers.environment,
    cluster: {
      region: answers.region,
      nodeSize: answers.nodeSize,
      nodeCount: answers.nodeCount
    },
    domain: answers.projectDomain
  }];

  // Ask if they want to add a second environment
  if (answers.environment === 'production') {
    const { addStaging } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addStaging',
        message: 'Add a staging environment for testing?',
        default: true
      }
    ]);

    if (addStaging) {
      const { stagingRegion, stagingNodeSize } = await inquirer.prompt([
        {
          type: 'list',
          name: 'stagingRegion',
          message: 'Staging environment region:',
          choices: regionChoices,
          default: answers.region
        },
        {
          type: 'list',
          name: 'stagingNodeSize',
          message: 'Staging node size (typically smaller):',
          choices: nodeSizeChoices.filter(choice => 
            choice.value.includes('2vcpu') || choice.value === answers.nodeSize
          ),
          default: 's-2vcpu-2gb'
        }
      ]);

      environments.push({
        name: 'staging',
        cluster: {
          region: stagingRegion,
          nodeSize: stagingNodeSize,
          nodeCount: Math.max(1, answers.nodeCount - 1)
        },
        domain: `staging.${answers.projectDomain}`
      });
    }
  }

  return {
    project: {
      name: answers.projectName,
      domain: answers.projectDomain,
      email: answers.projectEmail,
      description: answers.projectDescription || undefined
    },
    environments,
    features: {
      email: answers.enableEmail || false,
      monitoring: answers.enableMonitoring || true,
      backup: answers.enableBackup || true,
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