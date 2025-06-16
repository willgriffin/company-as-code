import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import ora from 'ora';
import chalk from 'chalk';
import { validateConfig, Config } from '@startup-gitops/shared';
import { CDKTFProvider } from '../providers/cdktf';
import { DigitalOceanProvider } from '../providers/digitalocean';

interface DeployOptions {
  environment?: string;
  config?: string;
}

export async function deploy(options: DeployOptions) {
  console.log(chalk.blue.bold('🚀 GitOps Infrastructure Deployment'));
  console.log(chalk.gray('Deploying with Terraform CDK\n'));

  try {
    // Load and validate configuration
    const config = await loadConfiguration(options.config);
    const targetEnv = options.environment || config.environments[0].name;
    const environment = config.environments.find(env => env.name === targetEnv);
    
    if (!environment) {
      throw new Error(`Environment "${targetEnv}" not found in configuration`);
    }

    console.log(chalk.yellow('📋 Deployment Configuration:'));
    console.log(chalk.gray(`  Project: ${config.project.name}`));
    console.log(chalk.gray(`  Environment: ${environment.name}`));
    console.log(chalk.gray(`  Domain: ${environment.domain}`));
    console.log(chalk.gray(`  Region: ${environment.cluster.region}`));
    console.log(chalk.gray(`  Applications: ${config.applications.join(', ') || 'none'}\n`));

    // Validate prerequisites
    await validatePrerequisites();

    // Initialize CDKTF provider
    const cdktf = new CDKTFProvider('../platform', !!process.env.VERBOSE);

    // Validate CDKTF configuration
    const validationResult = await cdktf.validateConfiguration();
    if (!validationResult.success) {
      throw new Error(`Configuration validation failed: ${validationResult.errors?.join(', ')}`);
    }

    // Plan deployment
    console.log(chalk.yellow('📊 Planning deployment...'));
    const planResult = await cdktf.plan();
    if (!planResult.success) {
      throw new Error(`Planning failed: ${planResult.errors?.join(', ')}`);
    }

    // Deploy infrastructure
    console.log(chalk.yellow('🏗️ Deploying infrastructure...'));
    const deployResult = await cdktf.deploy();
    if (!deployResult.success) {
      throw new Error(`Deployment failed: ${deployResult.errors?.join(', ')}`);
    }

    // Post-deployment validation
    if (deployResult.outputs) {
      await validateDeployment(deployResult.outputs, config);
    }

    // Success summary
    console.log(chalk.green.bold('\n✅ Deployment completed successfully!'));
    console.log(chalk.yellow('\n📋 Deployment Summary:'));
    console.log(chalk.gray(`  Environment: ${environment.name}`));
    console.log(chalk.gray(`  Cluster: ${config.project.name}-${environment.name}`));
    console.log(chalk.gray(`  Region: ${environment.cluster.region}`));
    console.log(chalk.gray(`  Nodes: ${environment.cluster.nodeCount}`));
    
    if (deployResult.outputs?.application_urls) {
      console.log(chalk.yellow('\n🔗 Application URLs:'));
      deployResult.outputs.application_urls.forEach((url: string) => {
        console.log(chalk.blue(`  ${url}`));
      });
    }

    console.log(chalk.yellow('\n🎯 Next Steps:'));
    console.log(chalk.gray('  1. Wait for applications to fully deploy (5-10 minutes)'));
    console.log(chalk.gray('  2. Check status: gitops-cli status'));
    console.log(chalk.gray('  3. Access your applications using the URLs above'));
    
  } catch (error) {
    console.error(chalk.red('❌ Deployment failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function loadConfiguration(configPath?: string): Promise<Config> {
  const path = configPath || 'gitops.config.json';
  
  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}\nRun 'gitops-cli init' to create one.`);
  }

  try {
    const configContent = readFileSync(path, 'utf-8');
    const rawConfig = JSON.parse(configContent);
    return validateConfig(rawConfig);
  } catch (error) {
    throw new Error(`Invalid configuration file: ${error instanceof Error ? error.message : error}`);
  }
}

async function validatePrerequisites(): Promise<void> {
  const spinner = ora('Validating prerequisites...').start();
  
  try {
    // Check environment variables
    const requiredEnvVars = ['DIGITALOCEAN_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Test DigitalOcean API access
    const doProvider = new DigitalOceanProvider(process.env.DIGITALOCEAN_TOKEN!);
    await doProvider.listRegions(); // Simple API test

    spinner.succeed('Prerequisites validated');
  } catch (error) {
    spinner.fail('Prerequisites validation failed');
    throw error;
  }
}

async function validateDeployment(outputs: Record<string, any>, config: Config): Promise<void> {
  const spinner = ora('Validating deployment...').start();
  
  try {
    // Check if cluster is accessible
    if (outputs.cluster_id) {
      const doProvider = new DigitalOceanProvider(process.env.DIGITALOCEAN_TOKEN!);
      const cluster = await doProvider.getCluster(outputs.cluster_id);
      
      if (!cluster || cluster.status !== 'running') {
        throw new Error('Cluster is not in running state');
      }
    }

    spinner.succeed('Deployment validated');
  } catch (error) {
    spinner.warn(`Deployment validation warning: ${error instanceof Error ? error.message : error}`);
  }
}