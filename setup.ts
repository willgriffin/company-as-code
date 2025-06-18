#!/usr/bin/env -S npx tsx

/**
 * Setup script for GitOps template prerequisites
 * 
 * This script handles the foundational setup that CDKTF doesn't cover:
 * - DigitalOcean Spaces bucket for Terraform state
 * - AWS SES credentials and IAM user setup
 * - GitHub secrets management
 * - Optional GitHub project board setup
 * 
 * Run this BEFORE deploying infrastructure with CDKTF.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createHash, createHmac } from 'crypto';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface Config {
  project: {
    name: string;
    domain: string;
    email: string;
    description?: string;
  };
  environments: Array<{
    name: 'staging' | 'production';
    cluster: {
      region: string;
      nodeSize: string;
      nodeCount: number;
      minNodes?: number;
      maxNodes?: number;
      haControlPlane?: boolean;
      version?: string;
    };
    domain: string;
  }>;
}

interface ConfigQuestions {
  projectName?: string;
  domain?: string;
  email?: string;
  description?: string;
  region?: string;
  nodeSize?: string;
  nodeCount?: number;
  environment?: string;
}

interface SetupOptions {
  config?: string;
  dryRun?: boolean;
  skipGithub?: boolean;
  skipProject?: boolean;
  verbose?: boolean;
  interactive?: boolean;
  assumeYes?: boolean;
  eject?: boolean;
}

class SetupError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SetupError';
  }
}

class GitOpsSetup {
  private config: Config;
  private options: SetupOptions;

  constructor(config: Config, options: SetupOptions = {}) {
    this.config = config;
    this.options = { interactive: true, ...options }; // Default to interactive mode
  }

  private log(message: string, color = colors.reset): void {
    console.log(`${color}${message}${colors.reset}`);
  }

  private logStep(step: string): void {
    this.log(`\n${colors.blue}${colors.bold}=== ${step} ===${colors.reset}`);
  }

  private logSuccess(message: string): void {
    this.log(`${colors.green}✓ ${message}${colors.reset}`);
  }

  private logWarning(message: string): void {
    this.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
  }

  private logError(message: string): void {
    this.log(`${colors.red}✗ ${message}${colors.reset}`);
  }

  private exec(command: string, silent = false): string {
    if (this.options.verbose && !silent) {
      this.log(`${colors.blue}Running: ${command}${colors.reset}`);
    }
    
    if (this.options.dryRun) {
      this.log(`${colors.yellow}[DRY-RUN] Would execute: ${command}${colors.reset}`);
      return '';
    }

    try {
      return execSync(command, { 
        encoding: 'utf-8',
        stdio: silent ? 'pipe' : 'inherit'
      }).trim();
    } catch (error: any) {
      throw new SetupError(`Command failed: ${command}\n${error.message}`, 'EXEC_FAILED');
    }
  }

  private checkPrerequisites(): void {
    this.logStep('Checking Prerequisites');

    const tools = [
      { name: 'doctl', command: 'doctl version', package: 'doctl' },
      { name: 'aws', command: 'aws --version', package: 'awscli' },
      { name: 'gh', command: 'gh --version', package: 'github-cli' },
      { name: 'jq', command: 'jq --version', package: 'jq' }
    ];

    for (const tool of tools) {
      try {
        this.exec(tool.command, true);
        this.logSuccess(`${tool.name} is available`);
      } catch {
        throw new SetupError(
          `${tool.name} is not installed. Install with: nix-shell -p ${tool.package}`, 
          'MISSING_TOOL'
        );
      }
    }

    // Check and setup authentication
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    this.logStep('Checking Authentication');

    // Check DigitalOcean authentication
    try {
      this.exec('doctl account get', true);
      this.logSuccess('DigitalOcean authenticated');
    } catch {
      if (this.options.interactive && !this.options.dryRun) {
        this.log(`${colors.yellow}DigitalOcean not authenticated. Running login...${colors.reset}`);
        this.log(`${colors.blue}Get your API token from: https://cloud.digitalocean.com/account/api/tokens${colors.reset}`);
        this.exec('doctl auth init');
        this.logSuccess('DigitalOcean authentication complete');
      } else {
        throw new SetupError(
          'DigitalOcean not authenticated. Run: doctl auth init',
          'AUTH_FAILED'
        );
      }
    }

    // Check AWS authentication
    try {
      this.exec('aws sts get-caller-identity', true);
      this.logSuccess('AWS authenticated');
    } catch {
      if (this.options.interactive && !this.options.dryRun) {
        this.log(`${colors.yellow}AWS not authenticated. Running configuration...${colors.reset}`);
        this.log(`${colors.blue}Get your AWS Access Keys from: https://console.aws.amazon.com/iam/home#/security_credentials${colors.reset}`);
        this.log('You will need your AWS Access Key ID and Secret Access Key');
        this.exec('aws configure');
        
        // Verify authentication worked
        try {
          this.exec('aws sts get-caller-identity', true);
          this.logSuccess('AWS authentication complete');
        } catch {
          throw new SetupError(
            'AWS authentication failed after configuration. Please check your credentials.',
            'AUTH_FAILED'
          );
        }
      } else {
        throw new SetupError(
          'AWS not authenticated. Run: aws configure',
          'AUTH_FAILED'
        );
      }
    }

    // Check GitHub authentication  
    try {
      this.exec('gh auth status', true);
      this.logSuccess('GitHub authenticated');
    } catch {
      if (this.options.interactive && !this.options.dryRun && !this.options.skipGithub) {
        this.log(`${colors.yellow}GitHub not authenticated. Running login...${colors.reset}`);
        this.log(`${colors.blue}This will open your web browser for GitHub authentication${colors.reset}`);
        this.exec('gh auth login');
        
        // Verify authentication worked
        try {
          this.exec('gh auth status', true);
          this.logSuccess('GitHub authentication complete');
        } catch {
          throw new SetupError(
            'GitHub authentication failed after login. Please try again.',
            'AUTH_FAILED'
          );
        }
      } else if (this.options.skipGithub) {
        this.logWarning('GitHub authentication skipped (--skip-github flag)');
      } else {
        throw new SetupError(
          'GitHub not authenticated. Run: gh auth login',
          'AUTH_FAILED'
        );
      }
    }
  }

  private async showConfirmationDialog(): Promise<void> {
    this.logStep('Account Verification & Confirmation');

    if (this.options.dryRun) {
      this.log(`${colors.yellow}[DRY-RUN] Skipping confirmation dialog${colors.reset}`);
      return;
    }

    // Gather account information
    const accountInfo = await this.gatherAccountInfo();

    // Display comprehensive confirmation
    this.log(`${colors.yellow}${colors.bold}⚠️  IMPORTANT: Please verify the accounts and resources to be created${colors.reset}\n`);
    
    this.log(`${colors.bold}${colors.blue}Project Configuration:${colors.reset}`);
    this.log(`  Name: ${this.config.project.name}`);
    this.log(`  Domain: ${this.config.project.domain}`);
    this.log(`  Email: ${this.config.project.email}`);
    this.log(`  Environment: ${this.config.environments[0].name}\n`);

    this.log(`${colors.bold}${colors.blue}Account Details:${colors.reset}`);
    this.log(`  ${colors.bold}DigitalOcean:${colors.reset} ${accountInfo.digitalOcean.email} (${accountInfo.digitalOcean.uuid})`);
    this.log(`  ${colors.bold}AWS:${colors.reset} ${accountInfo.aws.account} (${accountInfo.aws.user})`);
    if (!this.options.skipGithub) {
      this.log(`  ${colors.bold}GitHub:${colors.reset} ${accountInfo.github.user} (${accountInfo.github.account})`);
    }
    this.log('');

    this.log(`${colors.bold}${colors.blue}Resources to be Created:${colors.reset}`);
    this.log(`  ${colors.bold}DigitalOcean Spaces:${colors.reset}`);
    this.log(`    • Bucket: ${this.config.project.name}-terraform-state (${this.config.environments[0].cluster.region})`);
    this.log(`    • Access Key: ${this.config.project.name}-terraform-state`);
    
    this.log(`  ${colors.bold}AWS SES:${colors.reset}`);
    this.log(`    • IAM User: ${this.config.project.name}-ses-smtp`);
    this.log(`    • IAM Policy: ${this.config.project.name}-ses-policy`);
    this.log(`    • Domain: ${this.config.project.domain} (verification required)`);

    if (!this.options.skipGithub) {
      this.log(`  ${colors.bold}GitHub Repository:${colors.reset} ${accountInfo.github.repo}`);
      this.log(`    • Repository secrets (credentials and configuration)`);
      if (!this.options.skipProject) {
        this.log(`    • Workflow labels and project setup`);
      }
    }
    this.log('');

    this.log(`${colors.bold}${colors.blue}Estimated Costs:${colors.reset}`);
    this.log(`  • DigitalOcean Spaces: ~$5/month (250GB storage + transfers)`);
    this.log(`  • AWS SES: $0 (free tier: 62,000 emails/month)`);
    this.log(`  • GitHub: $0 (using existing repository)`);
    this.log('');

    // Interactive confirmation
    if (this.options.interactive && !this.options.assumeYes) {
      await this.promptForConfirmation();
    } else if (this.options.assumeYes) {
      this.logSuccess('Auto-confirming with --yes flag');
    }
  }

  private async gatherAccountInfo(): Promise<any> {
    const accountInfo: any = {};

    try {
      // DigitalOcean account info
      const doAccount = this.exec('doctl account get --format Email,UUID --no-header', true).split('\t');
      accountInfo.digitalOcean = {
        email: doAccount[0]?.trim() || 'Unknown',
        uuid: doAccount[1]?.trim() || 'Unknown'
      };
    } catch {
      accountInfo.digitalOcean = { email: 'Unknown', uuid: 'Unknown' };
    }

    try {
      // AWS account info
      const awsAccount = this.exec('aws sts get-caller-identity --query "[Account,Arn]" --output text', true).split('\t');
      const account = awsAccount[0]?.trim() || 'Unknown';
      const arn = awsAccount[1]?.trim() || 'Unknown';
      const user = arn.includes('user/') ? arn.split('user/')[1] : 
                   arn.includes('role/') ? arn.split('role/')[1] : 'Unknown';
      
      accountInfo.aws = {
        account: account,
        user: user,
        arn: arn
      };
    } catch {
      accountInfo.aws = { account: 'Unknown', user: 'Unknown', arn: 'Unknown' };
    }

    if (!this.options.skipGithub) {
      try {
        // GitHub account info
        const ghUser = this.exec('gh api user --jq .login', true).trim();
        const repoInfo = this.exec('gh repo view --json owner,name', true);
        const repo = JSON.parse(repoInfo);
        const repoName = `${repo.owner.login}/${repo.name}`;
        
        accountInfo.github = {
          user: ghUser,
          account: repo.owner.login,
          repo: repoName
        };
      } catch {
        accountInfo.github = { user: 'Unknown', account: 'Unknown', repo: 'Unknown' };
      }
    }

    return accountInfo;
  }

  private async promptForConfirmation(): Promise<void> {
    const { execSync } = await import('child_process');
    
    this.log(`${colors.yellow}${colors.bold}Do you want to proceed with creating these resources?${colors.reset}`);
    this.log(`Type 'yes' to continue, 'no' to abort:`);
    
    try {
      const response = execSync('read -p "> " response && echo $response', { 
        encoding: 'utf-8', 
        stdio: ['inherit', 'pipe', 'inherit'],
        shell: '/bin/bash'
      }).trim().toLowerCase();

      if (response !== 'yes' && response !== 'y') {
        this.log(`${colors.yellow}Setup aborted by user${colors.reset}`);
        process.exit(0);
      }
      
      this.logSuccess('Confirmation received, proceeding with setup...');
    } catch (error) {
      // Fallback for environments where interactive input doesn't work
      this.logWarning('Unable to prompt for confirmation, proceeding...');
    }
  }

  private async setupSpacesBucket(): Promise<{ accessKey: string; secretKey: string; bucketName: string }> {
    this.logStep('Setting up DigitalOcean Spaces for Terraform State');

    const bucketName = `${this.config.project.name}-terraform-state`;
    const region = this.config.environments[0].cluster.region;

    // Check if bucket already exists
    try {
      this.exec(`doctl spaces ls | grep -q "${bucketName}"`, true);
      this.logSuccess(`Spaces bucket "${bucketName}" already exists`);
    } catch {
      // Create bucket
      this.log(`Creating Spaces bucket: ${bucketName}`);
      this.exec(`doctl spaces create ${bucketName} --region ${region}`);
      this.logSuccess(`Created Spaces bucket: ${bucketName}`);
    }

    // Generate Spaces access keys
    const keyName = `${this.config.project.name}-terraform-state`;
    let accessKey: string;
    let secretKey: string;

    try {
      // Check if key already exists
      const existingKeys = this.exec('doctl spaces keys list --format Name --no-header', true);
      if (existingKeys.includes(keyName)) {
        this.logWarning(`Spaces key "${keyName}" already exists. Using existing key.`);
        // Note: We can't retrieve existing secret key, user needs to provide it
        throw new SetupError(
          `Spaces key "${keyName}" exists but secret key cannot be retrieved. Delete and recreate, or provide manually.`,
          'KEY_EXISTS'
        );
      }

      // Create new key
      this.log(`Creating Spaces access key: ${keyName}`);
      const keyOutput = this.exec(`doctl spaces keys create ${keyName} --format AccessKey,SecretKey --no-header`, true);
      const [newAccessKey, newSecretKey] = keyOutput.split('\t');
      accessKey = newAccessKey.trim();
      secretKey = newSecretKey.trim();
      
      this.logSuccess(`Created Spaces access key: ${accessKey}`);
    } catch (error) {
      if (error instanceof SetupError && error.code === 'KEY_EXISTS') {
        throw error;
      }
      throw new SetupError(`Failed to create Spaces access key: ${error}`, 'SPACES_KEY_FAILED');
    }

    return { accessKey, secretKey, bucketName };
  }

  private generateSesSmtpPassword(secretKey: string): string {
    const message = 'SendRawEmail';
    const versionInBytes = Buffer.from([0x04]);
    const signatureInBytes = Buffer.concat([versionInBytes, Buffer.from(secretKey, 'utf-8')]);
    
    const hmac = createHmac('sha256', signatureInBytes);
    hmac.update(message);
    
    return hmac.digest('base64');
  }

  private async setupSesCredentials(): Promise<{ username: string; password: string }> {
    this.logStep('Setting up AWS SES SMTP Credentials');


    const domain = this.config.project.domain;
    const userName = `${this.config.project.name}-ses-smtp`;
    const policyName = `${this.config.project.name}-ses-policy`;

    // Create IAM policy for SES
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'ses:SendEmail',
            'ses:SendRawEmail'
          ],
          Resource: `arn:aws:ses:*:*:identity/${domain}`
        }
      ]
    };

    this.log(`Creating IAM policy: ${policyName}`);
    try {
      this.exec(`aws iam create-policy --policy-name ${policyName} --policy-document '${JSON.stringify(policyDocument)}'`, true);
      this.logSuccess(`Created IAM policy: ${policyName}`);
    } catch {
      this.logWarning(`IAM policy ${policyName} may already exist`);
    }

    // Create IAM user
    this.log(`Creating IAM user: ${userName}`);
    try {
      this.exec(`aws iam create-user --user-name ${userName}`, true);
      this.logSuccess(`Created IAM user: ${userName}`);
    } catch {
      this.logWarning(`IAM user ${userName} may already exist`);
    }

    // Attach policy to user
    const accountId = this.exec('aws sts get-caller-identity --query Account --output text', true);
    const policyArn = `arn:aws:iam::${accountId}:policy/${policyName}`;
    
    try {
      this.exec(`aws iam attach-user-policy --user-name ${userName} --policy-arn ${policyArn}`, true);
      this.logSuccess(`Attached policy to user: ${userName}`);
    } catch {
      this.logWarning(`Policy may already be attached to ${userName}`);
    }

    // Create access keys
    this.log(`Creating access keys for: ${userName}`);
    let accessKey: string;
    let secretKey: string;

    try {
      const keyOutput = this.exec(`aws iam create-access-key --user-name ${userName} --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text`, true);
      [accessKey, secretKey] = keyOutput.split('\t');
      
      this.logSuccess(`Created access keys for: ${userName}`);
    } catch {
      throw new SetupError(`Failed to create access keys for ${userName}`, 'SES_KEY_FAILED');
    }

    // Generate SMTP password
    const smtpPassword = this.generateSesSmtpPassword(secretKey);

    this.log(`\n${colors.yellow}SES Setup Complete:${colors.reset}`);
    this.log(`Domain: ${domain}`);
    this.log(`SMTP Username: ${accessKey}`);
    this.log(`Access Key: ${accessKey}`);
    this.log(`Secret Key: ${secretKey}`);
    this.log(`SMTP Password: ${smtpPassword}`);

    this.log(`\n${colors.yellow}Next steps for SES:${colors.reset}`);
    this.log(`1. Verify domain in AWS SES console`);
    this.log(`2. Set up DKIM records`);
    this.log(`3. Request production access if needed`);

    return { username: accessKey, password: smtpPassword };
  }

  private async setGitHubSecrets(secrets: Record<string, string>): Promise<void> {
    this.logStep('Setting GitHub Repository Secrets');

    if (this.options.skipGithub) {
      this.logWarning('Skipping GitHub secrets setup');
      return;
    }

    // Get repository info
    const repoInfo = this.exec('gh repo view --json owner,name', true);
    const { owner, name } = JSON.parse(repoInfo);
    const repo = `${owner.login}/${name}`;

    this.log(`Setting secrets for repository: ${repo}`);

    for (const [key, value] of Object.entries(secrets)) {
      if (!value) {
        this.logWarning(`Skipping empty secret: ${key}`);
        continue;
      }

      try {
        this.exec(`gh secret set ${key} --body "${value}"`, true);
        this.logSuccess(`Set secret: ${key}`);
      } catch (error) {
        this.logError(`Failed to set secret ${key}: ${error}`);
      }
    }
  }

  private async setupGitHubProject(): Promise<void> {
    this.logStep('Setting up GitHub Project (Optional)');

    if (this.options.skipProject) {
      this.logWarning('Skipping GitHub project setup');
      return;
    }

    // Create workflow labels
    const labels = [
      { name: 'status:new-issue', color: 'f9f9f9', description: 'New issue that needs triage' },
      { name: 'status:backlog', color: 'eeeeee', description: 'Issue is in backlog' },
      { name: 'status:ready', color: 'yellow', description: 'Issue is ready to be worked on' },
      { name: 'status:in-progress', color: 'blue', description: 'Issue is currently being worked on' },
      { name: 'status:blocked', color: 'red', description: 'Issue is blocked' },
      { name: 'status:done', color: 'green', description: 'Issue has been completed' },
      { name: 'type:feature', color: 'blue', description: 'New feature request' },
      { name: 'type:bug', color: 'red', description: 'Bug report' },
      { name: 'type:enhancement', color: 'yellow', description: 'Enhancement to existing feature' },
      { name: 'type:documentation', color: 'purple', description: 'Documentation update' }
    ];

    this.log('Creating workflow labels...');
    for (const label of labels) {
      try {
        this.exec(`gh label create "${label.name}" --color ${label.color} --description "${label.description}"`, true);
        this.logSuccess(`Created label: ${label.name}`);
      } catch {
        this.logWarning(`Label ${label.name} may already exist`);
      }
    }

    this.logSuccess('GitHub project setup complete');
  }

  private async createCleanupIssue(): Promise<void> {
    this.logStep('Creating Template Cleanup Issue');

    if (this.options.skipGithub) {
      this.logWarning('GitHub setup skipped, not creating cleanup issue');
      return;
    }

    const issueBody = `## Template Cleanup Required

This issue was automatically created after repository setup to track cleanup of template artifacts.

### Cleanup Tasks
- [ ] Review generated configuration files  
- [ ] Test deployment pipeline
- [ ] Remove template-specific files when ready
- [ ] Verify all placeholders were replaced correctly

### Template Files to Remove (when ready)
- [ ] \`setup.ts\` - Setup script (keep if you want to re-run setup)
- [ ] \`setup.sh\` - Setup wrapper script  
- [ ] \`config.*.example\` - Example configuration files
- [ ] \`initial-setup.sh\` - Legacy setup script (if present)
- [ ] Template documentation that's no longer needed

### Generated Configuration to Review
- [ ] \`flux/\` - Kubernetes manifests (verify all placeholders replaced)
- [ ] \`platform/\` - CDKTF infrastructure code
- [ ] GitHub repository secrets (verify all are set correctly)
- [ ] DNS records (set up domain verification as instructed)

### Optional Cleanup
- [ ] Remove \`.github/workflows/create-setup-issue.yml\` (this workflow)
- [ ] Update README.md to reflect your project instead of template
- [ ] Remove any unused applications from \`flux/applications/\`
- [ ] Clean up .gitignore entries if needed

${this.options.skipProject ? '' : '- [ ] Keep GitHub project and workflow automation (manually delete if not needed)'}

### Eject Template (Advanced)
When you're completely done with template features:
\`\`\`bash
npx tsx setup.ts --eject
\`\`\`

This will remove all template-specific files automatically.

---
*This issue was created automatically by the GitOps template setup process.*`;

    try {
      this.exec(`gh issue create --title "chore: complete template cleanup and ejection" --body "${issueBody.replace(/"/g, '\\"')}" --label "template-cleanup"`, true);
      this.logSuccess('Created template cleanup issue');
    } catch (error) {
      this.logWarning(`Could not create GitHub issue: ${error}`);
      this.logWarning('You may need to authenticate with: gh auth login');
    }
  }

  private async ejectTemplate(): Promise<void> {
    this.logStep('Template Ejection Mode');
    
    this.log(`${colors.yellow}${colors.bold}⚠️ This will remove template-specific files from your repository${colors.reset}\n`);
    
    const filesToRemove = [
      'setup.ts',
      'setup.sh', 
      'config.json.example',
      'config.js.example',
      'config.ts.example',
      'initial-setup.sh',
      '.github/workflows/create-setup-issue.yml',
      'HYBRID-WORKFLOW.md'
    ];

    const optionalFiles = [
      'README.md',
      'WORKFLOW.md',
      'docs/workflow-requirements.md'
    ];

    this.log(`${colors.bold}${colors.blue}Files to be removed:${colors.reset}`);
    for (const file of filesToRemove) {
      if (existsSync(file)) {
        this.log(`  • ${file} ${colors.green}(exists)${colors.reset}`);
      } else {
        this.log(`  • ${file} ${colors.yellow}(not found)${colors.reset}`);
      }
    }

    this.log(`\n${colors.bold}${colors.blue}Optional files (you may want to update):${colors.reset}`);
    for (const file of optionalFiles) {
      if (existsSync(file)) {
        this.log(`  • ${file} ${colors.blue}(update to reflect your project)${colors.reset}`);
      }
    }

    // Interactive confirmation unless --yes flag
    if (!this.options.assumeYes) {
      this.log(`\n${colors.yellow}${colors.bold}Are you sure you want to eject the template?${colors.reset}`);
      this.log(`This will permanently remove template files. Type 'eject' to confirm:`);
      
      try {
        const { execSync } = await import('child_process');
        const response = execSync('read -p "> " response && echo $response', { 
          encoding: 'utf-8', 
          stdio: ['inherit', 'pipe', 'inherit'],
          shell: '/bin/bash'
        }).trim().toLowerCase();

        if (response !== 'eject') {
          this.log(`${colors.yellow}Ejection cancelled${colors.reset}`);
          return;
        }
      } catch (error) {
        this.logWarning('Unable to prompt for confirmation, proceeding...');
      }
    }

    // Remove files
    this.log(`\n${colors.blue}Removing template files...${colors.reset}`);
    let removedCount = 0;
    
    for (const file of filesToRemove) {
      if (existsSync(file)) {
        if (!this.options.dryRun) {
          try {
            this.exec(`rm -f "${file}"`, true);
            this.logSuccess(`Removed ${file}`);
            removedCount++;
          } catch (error) {
            this.logError(`Failed to remove ${file}: ${error}`);
          }
        } else {
          this.log(`${colors.yellow}[DRY-RUN] Would remove: ${file}${colors.reset}`);
          removedCount++;
        }
      }
    }

    // Create final ejection commit
    if (!this.options.dryRun && removedCount > 0) {
      try {
        this.exec('git add -A', true);
        this.exec('git commit -m "chore: eject GitOps template artifacts\n\nRemoved template-specific files after successful setup.\nRepository is now ready for independent development."', true);
        this.logSuccess('Created ejection commit');
      } catch (error) {
        this.logWarning(`Could not create git commit: ${error}`);
      }
    }

    this.logStep('Ejection Complete');
    this.logSuccess(`Template ejection complete! ${removedCount} files removed.`);
    this.log(`\n${colors.yellow}Final steps:${colors.reset}`);
    this.log('1. Update README.md to reflect your project');
    this.log('2. Remove any unused applications from flux/applications/');
    this.log('3. Customize the infrastructure as needed');
    this.log('\nYour repository is now fully independent from the template!');
  }

  public async run(): Promise<void> {
    try {
      // Handle eject mode separately
      if (this.options.eject) {
        await this.ejectTemplate();
        return;
      }

      this.log(`${colors.bold}${colors.blue}GitOps Template Setup${colors.reset}`);
      this.log(`Project: ${this.config.project.name}`);
      this.log(`Domain: ${this.config.project.domain}`);
      this.log(`Environment: ${this.config.environments[0].name}\n`);

      // Step 1: Check prerequisites
      this.checkPrerequisites();

      // Step 2: Show confirmation dialog with account details
      await this.showConfirmationDialog();

      // Step 3: Setup Spaces bucket for Terraform state
      const spacesConfig = await this.setupSpacesBucket();

      // Step 4: Setup SES credentials (if email enabled)
      const sesConfig = await this.setupSesCredentials();

      // Step 5: Set GitHub secrets
      const secrets: Record<string, string> = {
        DIGITALOCEAN_TOKEN: process.env.DIGITALOCEAN_TOKEN || '',
        SPACES_ACCESS_KEY_ID: spacesConfig.accessKey,
        SPACES_SECRET_ACCESS_KEY: spacesConfig.secretKey,
        SPACES_BUCKET_NAME: spacesConfig.bucketName,
        AWS_ACCESS_KEY_ID: sesConfig.username,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
        AWS_SES_SMTP_USERNAME: sesConfig.username,
        AWS_SES_SMTP_PASSWORD: sesConfig.password,
        ADMIN_EMAIL: this.config.project.email,
        DOMAIN: this.config.project.domain
      };

      await this.setGitHubSecrets(secrets);

      // Step 6: Setup GitHub project (optional)
      await this.setupGitHubProject();

      // Step 7: Create cleanup issue for template ejection
      await this.createCleanupIssue();

      this.logStep('Setup Complete');
      this.logSuccess('All prerequisites have been configured');
      this.log(`\n${colors.yellow}Next steps:${colors.reset}`);
      this.log('1. Run: npx tsx platform/src/main.ts (or use CDKTF CLI)');
      this.log('2. Wait for infrastructure deployment to complete');
      this.log('3. Access your applications at the configured domains');

    } catch (error) {
      if (error instanceof SetupError) {
        this.logError(`Setup failed: ${error.message}`);
        if (error.code) {
          this.logError(`Error code: ${error.code}`);
        }
      } else {
        this.logError(`Unexpected error: ${error}`);
      }
      process.exit(1);
    }
  }
}

// CLI handling
async function loadOrCreateConfig(configPath?: string): Promise<Config> {
  const paths = [
    configPath,
    'platform/config.json',
    'platform/config.js',
    'platform/config.ts',
    'config.json',
    'config.js',
    'config.ts',
    '../config.json',
    '../config.js',
    '../config.ts',
    process.env.GITOPS_CONFIG_PATH
  ].filter(Boolean);

  for (const path of paths) {
    if (path && existsSync(path)) {
      try {
        if (path.endsWith('.json')) {
          const content = readFileSync(path, 'utf-8');
          return JSON.parse(content);
        } else if (path.endsWith('.js') || path.endsWith('.ts')) {
          // For JS/TS files, we expect a default export or module.exports
          delete require.cache[require.resolve(path)];
          const rawConfig = require(path);
          return rawConfig.default || rawConfig;
        }
      } catch (error) {
        throw new SetupError(`Invalid configuration file ${path}: ${error}`, 'CONFIG_INVALID');
      }
    }
  }

  // No config found, create interactively
  console.log(`${colors.yellow}No configuration file found.${colors.reset}`);
  console.log('Let\'s create one interactively.\n');
  
  return await createConfigInteractively();
}

async function createConfigInteractively(): Promise<Config> {
  console.log(`${colors.bold}${colors.blue}Configuration Setup${colors.reset}`);
  console.log('Let\'s create your infrastructure configuration.\n');

  // Environment variable defaults (SETUP_* vars take precedence)
  const envDefaults = {
    projectName: process.env.SETUP_PROJECT_NAME || process.env.PROJECT_NAME,
    domain: process.env.SETUP_DOMAIN || process.env.DOMAIN,
    email: process.env.SETUP_EMAIL || process.env.EMAIL,
    description: process.env.SETUP_DESCRIPTION,
    region: process.env.SETUP_REGION || process.env.DO_REGION || 'nyc3',
    nodeSize: process.env.SETUP_NODE_SIZE || process.env.NODE_SIZE || 's-2vcpu-4gb',
    nodeCount: process.env.SETUP_NODE_COUNT ? parseInt(process.env.SETUP_NODE_COUNT) : 
               process.env.NODE_COUNT ? parseInt(process.env.NODE_COUNT) : 3,
    environment: process.env.SETUP_ENVIRONMENT || process.env.ENVIRONMENT || 'production'
  };

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = (question: string, defaultValue?: string): Promise<string> => {
    return new Promise(resolve => {
      const defaultDisplay = defaultValue ? ` (${defaultValue})` : '';
      readline.question(`${question}${defaultDisplay}: `, (answer: string) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  };

  try {
    const projectName = await prompt(
      'Project name (lowercase, hyphens only)', 
      envDefaults.projectName || 'my-startup'
    );

    const domain = await prompt(
      'Primary domain', 
      envDefaults.domain || 'example.com'
    );

    const email = await prompt(
      'Admin email (for SSL certificates)', 
      envDefaults.email || `admin@${domain}`
    );

    const description = await prompt(
      'Project description (optional)', 
      envDefaults.description || `GitOps infrastructure for ${projectName}`
    );

    const environment = await prompt(
      'Environment name (staging/production)', 
      envDefaults.environment
    );

    const region = await prompt(
      'DigitalOcean region', 
      envDefaults.region
    );

    const nodeSize = await prompt(
      'Node size', 
      envDefaults.nodeSize
    );

    const nodeCountStr = await prompt(
      'Node count', 
      envDefaults.nodeCount.toString()
    );

    const config: Config = {
      project: {
        name: projectName,
        domain: domain,
        email: email,
        description: description || undefined
      },
      environments: [{
        name: environment as 'staging' | 'production',
        cluster: {
          region: region,
          nodeSize: nodeSize,
          nodeCount: parseInt(nodeCountStr),
          haControlPlane: parseInt(nodeCountStr) >= 3
        },
        domain: domain
      }]
    };

    // Save config
    const configPath = 'platform/config.json';
    if (!existsSync('platform')) {
      console.log(`${colors.red}Platform directory not found. Run this from the repository root.${colors.reset}`);
      process.exit(1);
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`${colors.green}Configuration saved to ${configPath}${colors.reset}\n`);
    
    return config;
  } finally {
    readline.close();
  }
}

function showHelp(): void {
  console.log(`
GitOps Template Setup Script

USAGE:
  npx tsx setup.ts [OPTIONS]

OPTIONS:
  --config PATH        Configuration file path (default: config.json)
  --dry-run           Show what would be done without executing
  --skip-github       Skip GitHub secrets and project setup
  --skip-project      Skip GitHub project setup only
  --no-interactive    Skip automatic login prompts (fail if not authenticated)
  --yes               Skip confirmation dialog (auto-approve)
  --eject             Remove template artifacts (advanced)
  --verbose           Show detailed command output
  --help              Show this help message

EXAMPLES:
  npx tsx setup.ts                     # Run with automatic login prompts and confirmation
  npx tsx setup.ts --dry-run           # Preview what would be done
  npx tsx setup.ts --yes               # Auto-approve confirmation dialog
  npx tsx setup.ts --no-interactive    # Fail if credentials missing (CI mode)
  npx tsx setup.ts --skip-github       # Skip all GitHub setup
  npx tsx setup.ts --config config.ts  # Use TypeScript config file
  npx tsx setup.ts --eject             # Remove template files (after setup complete)

This script sets up prerequisites for CDKTF deployment:
- DigitalOcean Spaces bucket for Terraform state
- AWS SES credentials for email functionality
- GitHub repository secrets
- Optional GitHub project labels and workflow

ENVIRONMENT VARIABLES (for defaults):
  SETUP_PROJECT_NAME     Project name (overrides PROJECT_NAME)
  SETUP_DOMAIN           Primary domain (overrides DOMAIN)
  SETUP_EMAIL            Admin email (overrides EMAIL)
  SETUP_DESCRIPTION      Project description
  SETUP_REGION           DigitalOcean region (overrides DO_REGION)
  SETUP_NODE_SIZE        Kubernetes node size (overrides NODE_SIZE)
  SETUP_NODE_COUNT       Number of nodes (overrides NODE_COUNT)
  SETUP_ENVIRONMENT      Environment name (overrides ENVIRONMENT)

The script will automatically prompt for login if credentials are missing.
`);
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: SetupOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--config':
        options.config = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-github':
        options.skipGithub = true;
        break;
      case '--skip-project':
        options.skipProject = true;
        break;
      case '--no-interactive':
        options.interactive = false;
        break;
      case '--yes':
        options.assumeYes = true;
        break;
      case '--eject':
        options.eject = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }

  try {
    // For eject mode, we don't need a valid config
    const config = options.eject ? {} as Config : await loadOrCreateConfig(options.config);
    const setup = new GitOpsSetup(config, options);
    await setup.run();
  } catch (error) {
    if (error instanceof SetupError) {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      process.exit(1);
    } else {
      console.error(`${colors.red}Unexpected error: ${error}${colors.reset}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}