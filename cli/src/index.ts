#!/usr/bin/env node

import { config as dotenvConfig } from 'dotenv';
import { Command } from 'commander';

// Load environment variables from .env file
dotenvConfig({ path: ['.env.local', '.env'] });
import { init } from './commands/init';
import { deploy } from './commands/deploy';
import { destroy } from './commands/destroy';
import { status } from './commands/status';
import { config } from './commands/config';

const program = new Command()
  .name('gitops-cli')
  .description('Manage GitOps deployments with Terraform CDK')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--dry-run', 'Show what would be done without executing');

program
  .command('init')
  .description('Initialize a new GitOps deployment')
  .option('-i, --interactive', 'Interactive mode', true)
  .option('-c, --config <path>', 'Configuration file path')
  .action(init);

program
  .command('deploy')
  .description('Deploy infrastructure')
  .option('-e, --environment <env>', 'Target environment', 'production')
  .option('-c, --config <path>', 'Configuration file path')
  .action(deploy);

program
  .command('destroy')
  .description('Destroy infrastructure')
  .option('-e, --environment <env>', 'Target environment')
  .option('-c, --config <path>', 'Configuration file path')
  .option('--confirm', 'Skip confirmation prompt')
  .action(destroy);

program
  .command('status')
  .description('Check deployment status')
  .option('-e, --environment <env>', 'Target environment')
  .option('-c, --config <path>', 'Configuration file path')
  .action(status);

program
  .command('config')
  .description('Manage configuration')
  .addCommand(
    new Command('validate')
      .description('Validate configuration file')
      .option('-c, --config <path>', 'Configuration file path')
      .action(config.validate)
  )
  .addCommand(
    new Command('init')
      .description('Initialize configuration file')
      .option('-o, --output <path>', 'Output file path', 'gitops.config.json')
      .action(config.init)
  );

// Global error handler
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

program.parse();