import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { validateConfig, Config } from '@startup-gitops/shared';
import { DigitalOceanProvider } from '../providers/digitalocean';
import { CDKTFProvider } from '../providers/cdktf';

interface StatusOptions {
  environment?: string;
  config?: string;
}

interface ApplicationStatus {
  name: string;
  status: 'running' | 'starting' | 'error' | 'not-deployed';
  pods?: { ready: number; total: number };
  url?: string;
}

export async function status(options: StatusOptions) {
  console.log(chalk.blue.bold('📊 GitOps Deployment Status'));
  console.log(chalk.gray('Checking infrastructure and application health\n'));

  try {
    // Load configuration
    const config = await loadConfiguration(options.config);
    const targetEnv = options.environment || config.environments[0].name;
    const environment = config.environments.find(env => env.name === targetEnv);
    
    if (!environment) {
      throw new Error(`Environment "${targetEnv}" not found in configuration`);
    }

    console.log(chalk.yellow('🔍 Environment Information:'));
    console.log(chalk.gray(`  Project: ${config.project.name}`));
    console.log(chalk.gray(`  Environment: ${environment.name}`));
    console.log(chalk.gray(`  Domain: ${environment.domain}\n`));

    // Check infrastructure status
    await checkInfrastructureStatus(config, environment);
    
    // Check application status if cluster is accessible
    if (await isClusterAccessible()) {
      await checkApplicationStatus(config, environment);
    } else {
      console.log(chalk.yellow('⚠️  Cluster not accessible - skipping application status'));
    }

    // Display URLs
    displayApplicationUrls(config, environment);

  } catch (error) {
    console.error(chalk.red('❌ Status check failed:'), error instanceof Error ? error.message : error);
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

async function checkInfrastructureStatus(config: Config, environment: any): Promise<void> {
  console.log(chalk.yellow('🏗️ Infrastructure Status:'));
  
  if (!process.env.DIGITALOCEAN_TOKEN) {
    console.log(chalk.yellow('  ⚠️  DIGITALOCEAN_TOKEN not set - cannot check cluster status'));
    return;
  }

  const doProvider = new DigitalOceanProvider(process.env.DIGITALOCEAN_TOKEN);
  const clusterName = `${config.project.name}-${environment.name}`;
  
  // Check cluster status
  const spinner = ora('Checking Kubernetes cluster...').start();
  try {
    const cluster = await doProvider.getCluster(clusterName);
    
    if (cluster) {
      const statusIcon = cluster.status === 'running' ? '✅' : 
                        cluster.status === 'provisioning' ? '🔄' : '❌';
      spinner.succeed();
      console.log(chalk.green(`  ${statusIcon} Kubernetes Cluster: ${cluster.status}`));
      console.log(chalk.gray(`    • Region: ${cluster.region}`));
      console.log(chalk.gray(`    • Nodes: ${cluster.nodeCount}`));
      console.log(chalk.gray(`    • Version: ${cluster.version}`));
      console.log(chalk.gray(`    • Endpoint: ${cluster.endpoint}`));
    } else {
      spinner.warn('Cluster not found');
      console.log(chalk.red('  ❌ Kubernetes Cluster: Not found'));
      console.log(chalk.gray('    Run: gitops-cli deploy'));
    }
  } catch (error) {
    spinner.fail('Failed to check cluster status');
    console.log(chalk.red(`  ❌ Cluster check failed: ${error instanceof Error ? error.message : error}`));
  }

  // Check CDKTF stack status
  try {
    const cdktf = new CDKTFProvider('../platform');
    const stacks = await cdktf.listStacks();
    
    if (stacks.length > 0) {
      console.log(chalk.green('  ✅ Terraform Stacks: Deployed'));
      stacks.forEach(stack => {
        console.log(chalk.gray(`    • ${stack}`));
      });
    } else {
      console.log(chalk.yellow('  ⚠️  Terraform Stacks: Not deployed'));
    }
  } catch (error) {
    console.log(chalk.yellow('  ⚠️  Cannot check Terraform stack status'));
  }
}

async function isClusterAccessible(): Promise<boolean> {
  try {
    execSync('kubectl cluster-info', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function checkApplicationStatus(config: Config, environment: any): Promise<void> {
  console.log(chalk.yellow('\n📱 Application Status:'));
  
  const applications: ApplicationStatus[] = [];
  
  for (const app of config.applications) {
    const appStatus = await getApplicationStatus(app, environment);
    applications.push(appStatus);
  }

  if (applications.length === 0) {
    console.log(chalk.gray('  No applications configured'));
    return;
  }

  applications.forEach(app => {
    const statusIcon = app.status === 'running' ? '✅' : 
                       app.status === 'starting' ? '🔄' : 
                       app.status === 'error' ? '❌' : '⚪';
    
    const podInfo = app.pods ? `(${app.pods.ready}/${app.pods.total} pods)` : '';
    console.log(chalk.green(`  ${statusIcon} ${app.name}: ${app.status} ${podInfo}`));
  });
}

async function getApplicationStatus(appName: string, environment: any): Promise<ApplicationStatus> {
  try {
    // Try to get pod status for the application
    const output = execSync(
      `kubectl get pods -l app=${appName} -o json`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    const pods = JSON.parse(output);
    const totalPods = pods.items.length;
    
    if (totalPods === 0) {
      return {
        name: getDisplayName(appName),
        status: 'not-deployed'
      };
    }

    const readyPods = pods.items.filter((pod: any) => 
      pod.status.conditions?.some((cond: any) => 
        cond.type === 'Ready' && cond.status === 'True'
      )
    ).length;

    const status = readyPods === totalPods ? 'running' : 
                   readyPods > 0 ? 'starting' : 'error';

    return {
      name: getDisplayName(appName),
      status,
      pods: { ready: readyPods, total: totalPods },
      url: getApplicationUrl(appName, environment.domain)
    };

  } catch (error) {
    return {
      name: getDisplayName(appName),
      status: 'not-deployed'
    };
  }
}

function getDisplayName(appName: string): string {
  const names: Record<string, string> = {
    'keycloak': 'Keycloak',
    'mattermost': 'Mattermost',
    'nextcloud': 'Nextcloud',
    'mailu': 'Mailu'
  };
  return names[appName] || appName;
}

function getApplicationUrl(appName: string, domain: string): string {
  const subdomains: Record<string, string> = {
    'keycloak': 'auth',
    'mattermost': 'chat',
    'nextcloud': 'files',
    'mailu': 'mail'
  };
  const subdomain = subdomains[appName] || appName;
  return `https://${subdomain}.${domain}`;
}

function displayApplicationUrls(config: Config, environment: any): void {
  if (config.applications.length === 0) return;

  console.log(chalk.yellow('\n🔗 Application URLs:'));
  config.applications.forEach(app => {
    const url = getApplicationUrl(app, environment.domain);
    console.log(chalk.blue(`  ${getDisplayName(app)}: ${url}`));
  });

  console.log(chalk.yellow('\n💡 Tips:'));
  console.log(chalk.gray('  • Applications may take 5-10 minutes to fully start'));
  console.log(chalk.gray('  • Check logs: kubectl logs -l app=<app-name>'));
  console.log(chalk.gray('  • Force refresh: kubectl rollout restart deployment/<app-name>'));
}