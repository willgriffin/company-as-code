#!/usr/bin/env node

/**
 * Helper script to get CDKTF stack names based on project configuration
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

function getStackNames(projectName, includeSetup = false) {
  const stacks = [];

  // Only include setup stack if requested (it will be removed after template ejection)
  if (includeSetup) {
    stacks.push(`${projectName}-setup`);
  }

  // Core infrastructure stacks
  stacks.push(`${projectName}-spaces`);
  stacks.push(`${projectName}-ses`);

  // Environment-specific stacks (currently only production)
  stacks.push(`${projectName}-production`);
  stacks.push(`${projectName}-production-flux`);

  // GitHub secrets (last)
  stacks.push(`${projectName}-github-secrets`);

  return stacks;
}

function validateEnvironment() {
  const requiredVars = [
    'DIGITALOCEAN_TOKEN',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'TERRAFORM_STATE_BUCKET',
    'TERRAFORM_STATE_REGION',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Make sure to run setup.ts first or set these environment variables.');
    return false;
  }

  console.log('✅ Environment variables validated');
  return true;
}

// CLI interface
const command = process.argv[2];
const config = loadConfig();
const projectName = config.project.name;

switch (command) {
  case 'list':
    const stacks = getStackNames(projectName);
    console.log(stacks.join(' '));
    break;

  case 'list-with-setup':
    const stacksWithSetup = getStackNames(projectName, true);
    console.log(stacksWithSetup.join(' '));
    break;

  case 'validate':
    if (!validateEnvironment()) {
      process.exit(1);
    }
    break;

  case 'project-name':
    console.log(projectName);
    break;

  default:
    console.log(`Usage: node get-stacks.js <command>

Commands:
  list              List all stack names (without setup)
  list-with-setup   List all stack names (including setup)
  validate          Validate required environment variables
  project-name      Get project name from config

Examples:
  node get-stacks.js list
  node get-stacks.js validate
`);
    process.exit(1);
}
