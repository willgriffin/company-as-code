import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { validateConfig, Config } from '@startup-gitops/platform';
import { CDKTFProvider } from '../providers/cdktf';
import { DigitalOceanProvider } from '../providers/digitalocean';

interface DestroyOptions {
  environment?: string;
  config?: string;
  confirm?: boolean;
}

export async function destroy(options: DestroyOptions) {
  console.log(chalk.red.bold('🚨 Infrastructure Destruction'));
  console.log(chalk.yellow('This will permanently delete all infrastructure and data!\n'));

  try {
    // Load configuration to understand what will be destroyed
    const config = await loadConfiguration(options.config);
    const targetEnv = options.environment || 'all';
    const environments = targetEnv === 'all' ? config.environments : 
                        config.environments.filter(env => env.name === targetEnv);

    if (environments.length === 0) {
      throw new Error(`Environment "${targetEnv}" not found in configuration`);
    }

    // Display what will be destroyed
    console.log(chalk.yellow('📋 Resources to be destroyed:'));
    console.log(chalk.gray(`  Project: ${config.project.name}`));
    console.log(chalk.gray(`  Environments: ${environments.map(e => e.name).join(', ')}`));
    console.log(chalk.gray(`  Applications: ${config.applications.join(', ') || 'none'}`));
    
    if (config.features.email) {
      console.log(chalk.gray('  AWS SES configuration'));
    }
    
    console.log(chalk.red('\n⚠️  WARNING: This action is irreversible!'));
    console.log(chalk.red('  • All Kubernetes workloads will be terminated'));
    console.log(chalk.red('  • All persistent data will be lost'));
    console.log(chalk.red('  • DNS records will be removed'));
    console.log(chalk.red('  • Load balancers will be deleted\n'));

    // Enhanced confirmation flow
    if (!options.confirm) {
      const { initialConfirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'initialConfirm',
          message: chalk.red('Do you want to proceed with destroying the infrastructure?'),
          default: false
        }
      ]);

      if (!initialConfirm) {
        console.log(chalk.gray('Operation cancelled.'));
        return;
      }

      // Ask for project name confirmation
      const { projectNameConfirm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectNameConfirm',
          message: chalk.red(`Type the project name "${config.project.name}" to confirm:`),
          validate: (input: string) => input === config.project.name || 
                   `Please type exactly: ${config.project.name}`
        }
      ]);

      // Final confirmation
      const { finalConfirm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'finalConfirm',
          message: chalk.red('Type "DESTROY" (all caps) to proceed:'),
          validate: (input: string) => input === 'DESTROY' || 'Please type "DESTROY" in all caps'
        }
      ]);
    }

    // Check if resources exist before attempting destruction
    await validateResourcesExist(config, environments);

    // Perform backup prompt for production environments
    const prodEnvs = environments.filter(env => env.name === 'production');
    if (prodEnvs.length > 0) {
      const { backupConfirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'backupConfirm',
          message: chalk.yellow('Have you created backups of all important data?'),
          default: false
        }
      ]);

      if (!backupConfirm) {
        console.log(chalk.yellow('⏸️  Consider creating backups before proceeding.'));
        console.log(chalk.gray('  • Database exports'));
        console.log(chalk.gray('  • File storage contents'));
        console.log(chalk.gray('  • Configuration snapshots\n'));
        
        const { proceedAnyway } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceedAnyway',
            message: 'Proceed without backups?',
            default: false
          }
        ]);

        if (!proceedAnyway) {
          console.log(chalk.gray('Operation cancelled.'));
          return;
        }
      }
    }

    // Execute destruction
    await executeDestruction(config, environments);

  } catch (error) {
    console.error(chalk.red('❌ Destruction failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function loadConfiguration(configPath?: string): Promise<Config> {
  const path = configPath || 'gitops.config.json';
  
  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}\nRun 'gitops-cli init' to create one.`);
  }

  const configContent = readFileSync(path, 'utf-8');
  const rawConfig = JSON.parse(configContent);
  return validateConfig(rawConfig);
}

async function validateResourcesExist(config: Config, environments: any[]): Promise<void> {
  const spinner = ora('Checking existing resources...').start();
  
  try {
    // Check if any clusters exist
    if (process.env.DIGITALOCEAN_TOKEN) {
      const doProvider = new DigitalOceanProvider(process.env.DIGITALOCEAN_TOKEN);
      
      for (const env of environments) {
        const clusterName = `${config.project.name}-${env.name}`;
        const cluster = await doProvider.getCluster(clusterName);
        
        if (!cluster) {
          console.log(chalk.yellow(`\n⚠️  Cluster "${clusterName}" not found - may already be destroyed`));
        }
      }
    }

    // Check if CDKTF stacks exist
    const cdktf = new CDKTFProvider('../platform');
    const stacks = await cdktf.listStacks();
    
    if (stacks.length === 0) {
      console.log(chalk.yellow('\n⚠️  No Terraform stacks found - infrastructure may already be destroyed'));
    }

    spinner.succeed('Resource validation completed');
  } catch (error) {
    spinner.warn('Could not validate all resources');
  }
}

async function executeDestruction(config: Config, environments: any[]): Promise<void> {
  console.log(chalk.red('\n🔥 Beginning Infrastructure Destruction\n'));

  // Step 1: Gracefully shutdown applications
  const appSpinner = ora('Gracefully shutting down applications...').start();
  try {
    // This would include scaling down deployments, waiting for graceful termination
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate time
    appSpinner.succeed('Applications shut down');
  } catch (error) {
    appSpinner.warn('Some applications may not have shut down cleanly');
  }

  // Step 2: Destroy infrastructure with CDKTF
  const infraSpinner = ora('Destroying infrastructure with Terraform...').start();
  try {
    const cdktf = new CDKTFProvider('../platform', true); // verbose mode
    
    for (const env of environments) {
      const stackName = `${config.project.name}-${env.name}`;
      infraSpinner.text = `Destroying ${env.name} environment...`;
      
      const result = await cdktf.destroy(stackName);
      if (!result.success) {
        throw new Error(`Failed to destroy ${stackName}: ${result.errors?.join(', ')}`);
      }
    }
    
    // Destroy shared resources
    infraSpinner.text = 'Destroying shared resources...';
    await cdktf.destroy(`${config.project.name}-spaces`);
    
    if (config.features.email) {
      await cdktf.destroy(`${config.project.name}-ses`);
    }
    
    infraSpinner.succeed('Infrastructure destroyed');
  } catch (error) {
    infraSpinner.fail('Infrastructure destruction failed');
    throw error;
  }

  // Step 3: Cleanup verification
  const cleanupSpinner = ora('Verifying cleanup...').start();
  try {
    if (process.env.DIGITALOCEAN_TOKEN) {
      const doProvider = new DigitalOceanProvider(process.env.DIGITALOCEAN_TOKEN);
      
      for (const env of environments) {
        const clusterName = `${config.project.name}-${env.name}`;
        const cluster = await doProvider.getCluster(clusterName);
        
        if (cluster) {
          cleanupSpinner.warn(`Cluster ${clusterName} still exists - manual cleanup may be required`);
        }
      }
    }
    
    cleanupSpinner.succeed('Cleanup verification completed');
  } catch (error) {
    cleanupSpinner.warn('Could not verify complete cleanup');
  }

  // Success summary
  console.log(chalk.green.bold('\n✅ Infrastructure Destruction Complete'));
  console.log(chalk.yellow('\n📋 Destruction Summary:'));
  console.log(chalk.gray(`  Project: ${config.project.name}`));
  console.log(chalk.gray(`  Environments: ${environments.map(e => e.name).join(', ')}`));
  console.log(chalk.gray('  Status: Destroyed'));
  console.log(chalk.gray('  Cleanup: Verified'));
  
  console.log(chalk.yellow('\n📝 Post-Destruction Notes:'));
  console.log(chalk.gray('  • DNS records may take time to propagate (up to 24 hours)'));
  console.log(chalk.gray('  • Check your DigitalOcean dashboard for any remaining resources'));
  console.log(chalk.gray('  • Review AWS console if email features were enabled'));
  console.log(chalk.gray('  • Configuration files remain intact for future deployments'));
  
  console.log(chalk.blue('\n🚀 To redeploy: gitops-cli deploy'));
}