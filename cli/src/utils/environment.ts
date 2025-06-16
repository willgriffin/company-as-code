import { Config } from '@startup-gitops/platform';
import chalk from 'chalk';

interface EnvironmentValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(config?: Config): EnvironmentValidationResult {
  const requiredEnvVars = ['DIGITALOCEAN_TOKEN'];
  const conditionalEnvVars: Record<string, string[]> = {
    email: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  };
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required environment variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }
  
  // Check conditional environment variables based on config
  if (config?.features?.email) {
    for (const varName of conditionalEnvVars.email) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        missing.push(varName);
      }
    }
  }
  
  // Validate token formats
  const doToken = process.env.DIGITALOCEAN_TOKEN;
  if (doToken && !doToken.match(/^dop_v1_[a-f0-9]{64}$/)) {
    warnings.push('DigitalOcean token format appears invalid (expected: dop_v1_...)');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

export function displayEnvironmentHelp(): void {
  console.log(chalk.yellow('\n💡 Environment Variable Setup:'));
  console.log(chalk.gray('  Create a .env file in your project root with:'));
  console.log(chalk.gray('  DIGITALOCEAN_TOKEN=dop_v1_your_token_here'));
  console.log(chalk.gray('  AWS_ACCESS_KEY_ID=your_aws_access_key  # (if email features enabled)'));
  console.log(chalk.gray('  AWS_SECRET_ACCESS_KEY=your_aws_secret_key  # (if email features enabled)'));
  console.log(chalk.gray('\n  Or set them in your shell environment:'));
  console.log(chalk.gray('  export DIGITALOCEAN_TOKEN=dop_v1_your_token_here'));
}

export function throwEnvironmentError(validation: EnvironmentValidationResult): never {
  console.error(chalk.red('❌ Missing required environment variables:'));
  for (const varName of validation.missing) {
    console.error(chalk.red(`  • ${varName}`));
  }
  
  displayEnvironmentHelp();
  
  throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`);
}