#!/usr/bin/env node

/**
 * Extract kubeconfig from CDKTF output and save locally
 * Based on workflow logic from .github/workflows/terraform-deploy.yml
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');

  if (!fs.existsSync(configPath)) {
    console.error('❌ config.json not found. Run setup.ts first or create the config file.');
    process.exit(1);
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Failed to parse config.json:', error.message);
    process.exit(1);
  }
}

function extractKubeconfig(options = {}) {
  const config = loadConfig();
  const projectName = config.project.name;
  const stackName = `${projectName}-production`;

  if (!options.quiet) {
    console.log('🔍 Extracting kubeconfig from CDKTF output...');
  }

  // Check if cdktf-output.json exists
  const outputPath = path.join(__dirname, '..', 'cdktf-output.json');

  if (!fs.existsSync(outputPath)) {
    console.error('❌ cdktf-output.json not found. Run "pnpm output" first to generate it.');
    process.exit(1);
  }

  let outputData;
  try {
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    outputData = JSON.parse(outputContent);
  } catch (error) {
    console.error('❌ Failed to parse cdktf-output.json:', error.message);
    process.exit(1);
  }

  // Validate stack exists in output
  if (!outputData[stackName]) {
    console.error(`❌ Stack '${stackName}' not found in CDKTF output`);
    console.error('Available stacks:');
    Object.keys(outputData).forEach(stack => console.error(`   - ${stack}`));
    process.exit(1);
  }

  // Extract kubeconfig
  const stackOutput = outputData[stackName];
  const kubeconfigContent = stackOutput.kubeconfig;

  if (!kubeconfigContent) {
    console.error(`❌ Kubeconfig not found in stack output`);
    console.error(`Available outputs for stack '${stackName}':`);
    Object.keys(stackOutput).forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  if (options.base64) {
    // Output base64 encoded for GitHub Actions
    const base64Content = Buffer.from(kubeconfigContent).toString('base64');
    console.log(base64Content);
    return;
  }

  if (options.raw) {
    // Output raw content
    console.log(kubeconfigContent);
    return;
  }

  // Save kubeconfig locally (default behavior)
  const kubeconfigPath = path.join(__dirname, '..', 'kubeconfig.yaml');

  try {
    fs.writeFileSync(kubeconfigPath, kubeconfigContent, 'utf-8');
    console.log(`✅ Kubeconfig saved to: ${kubeconfigPath}`);

    // Set as environment variable for current shell
    console.log('');
    console.log('💡 To use this kubeconfig, run:');
    console.log(`   export KUBECONFIG=${kubeconfigPath}`);
    console.log('   kubectl get nodes');

    // Also save the export command
    const envPath = path.join(__dirname, '..', 'kubeconfig.env');
    fs.writeFileSync(envPath, `export KUBECONFIG=${kubeconfigPath}\n`, 'utf-8');
    console.log('');
    console.log('💡 Or source the environment file:');
    console.log(`   source ${envPath}`);
  } catch (error) {
    console.error('❌ Failed to save kubeconfig:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

if (command === '--help' || command === '-h') {
  console.log(`Usage: node extract-kubeconfig.js [options]

This script extracts the kubeconfig from CDKTF output.

Options:
  --base64    Output base64 encoded kubeconfig (for GitHub Actions)
  --raw       Output raw kubeconfig content
  (no args)   Save kubeconfig locally (default)

Prerequisites:
1. Run "pnpm deploy" or "pnpm output" to generate cdktf-output.json
2. Ensure the cluster has been deployed successfully

Default output:
- kubeconfig.yaml: The kubeconfig file
- kubeconfig.env: Environment variable export command

Examples:
  node extract-kubeconfig.js                # Save locally
  node extract-kubeconfig.js --base64       # Output base64 for GitHub Actions
  node extract-kubeconfig.js --raw          # Output raw content to stdout
`);
  process.exit(0);
}

const options = {
  base64: command === '--base64',
  raw: command === '--raw',
  quiet: command === '--base64' || command === '--raw',
};

extractKubeconfig(options);
