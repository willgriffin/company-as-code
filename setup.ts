#!/usr/bin/env -S npx tsx

/**
 * Setup script for GitOps template prerequisites
 * 
 * This script handles the foundational setup that CDKTF doesn't cover:
 * - AWS S3 bucket for Terraform state storage
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
  createPr?: boolean;
  noPr?: boolean;
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

  private async checkPrerequisites(): Promise<void> {
    this.logStep('Checking Prerequisites');

    const tools = [
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
    await this.checkAuthentication();
  }

  private async checkAuthentication(): Promise<void> {
    this.logStep('Checking Authentication');

    // Check DigitalOcean token
    if (!process.env.DIGITALOCEAN_TOKEN) {
      throw new SetupError(
        'DIGITALOCEAN_TOKEN environment variable not set. Get your API token from: https://cloud.digitalocean.com/account/api/tokens',
        'AUTH_FAILED'
      );
    }
    this.logSuccess('DigitalOcean token is set');

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

    // Check GitHub authentication and permissions
    if (!this.options.skipGithub) {
      await this.checkGitHubAuthentication();
    } else {
      this.logWarning('GitHub authentication skipped (--skip-github flag)');
    }
  }

  private async checkGitHubAuthentication(): Promise<void> {
    // Determine which token to use (prefer GH_TOKEN for Codespaces)
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    
    if (!token) {
      if (this.options.interactive && !this.options.dryRun) {
        this.log(`${colors.yellow}No GitHub token found. Running gh auth login...${colors.reset}`);
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
      } else {
        throw new SetupError(
          'No GitHub token found. Set GH_TOKEN (for Codespaces) or GITHUB_TOKEN environment variable, or run: gh auth login',
          'AUTH_FAILED'
        );
      }
    } else {
      // Test token permissions by trying to get repo info
      try {
        const repoInfo = this.exec('gh repo view --json owner,name', true);
        const repo = JSON.parse(repoInfo);
        const repoFullName = `${repo.owner.login}/${repo.name}`;
        
        this.logSuccess(`GitHub authenticated for repository: ${repoFullName}`);
        
        // Test if we can create secrets (this requires admin permissions)
        try {
          // Try to get existing secrets (this also requires admin permissions)
          this.exec('gh secret list', true);
          this.logSuccess('GitHub token has repository admin permissions');
        } catch {
          throw new SetupError(
            `GitHub token lacks repository admin permissions required to manage secrets.\n` +
            `For Codespaces: Set GH_TOKEN in your Codespaces secrets with 'repo' scope.\n` +
            `For local development: Use 'gh auth login' with appropriate permissions.`,
            'INSUFFICIENT_PERMISSIONS'
          );
        }
      } catch (error) {
        if (error instanceof SetupError) {
          throw error;
        }
        throw new SetupError(
          'GitHub authentication failed. Please check your token or run: gh auth login',
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
    this.log(`  ${colors.bold}AWS S3:${colors.reset}`);
    this.log(`    • Terraform State Bucket: ${this.config.project.name}-terraform-state`);
    this.log(`    • Versioning: Enabled`);
    this.log(`    • Encryption: AES256`);
    
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
    this.log(`  • AWS S3 (Terraform state): ~$0.02/month (minimal storage)`);
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
      // DigitalOcean account info via API
      const response = await fetch('https://api.digitalocean.com/v2/account', {
        headers: {
          'Authorization': `Bearer ${process.env.DIGITALOCEAN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json() as { account?: { email?: string; uuid?: string } };
        accountInfo.digitalOcean = {
          email: data.account?.email || 'Unknown',
          uuid: data.account?.uuid || 'Unknown'
        };
      } else {
        throw new Error(`API response: ${response.status}`);
      }
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
    const readline = await import('readline');
    
    this.log(`${colors.yellow}${colors.bold}Do you want to proceed with creating these resources?${colors.reset}`);
    this.log(`Type 'yes' to continue, 'no' to abort:`);
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('> ', (answer) => {
        rl.close();
        const response = answer.trim().toLowerCase();
        
        if (response !== 'yes' && response !== 'y') {
          this.log(`${colors.yellow}Setup aborted by user${colors.reset}`);
          process.exit(0);
        }
        
        this.logSuccess('Confirmation received, proceeding with setup...');
        resolve();
      });
    });
  }

  private async setupS3StateBucket(): Promise<{ bucketName: string; region: string }> {
    this.logStep('Setting up AWS S3 for Terraform State');

    const bucketName = `${this.config.project.name}-terraform-state`;
    const region = process.env.AWS_REGION || 'us-east-1';

    // Check if bucket already exists
    try {
      this.exec(`aws s3 ls s3://${bucketName} 2>&1`, true);
      this.logSuccess(`S3 bucket "${bucketName}" already exists`);
    } catch {
      // Create bucket
      this.log(`Creating S3 bucket: ${bucketName}`);
      
      // Create bucket with versioning
      if (region === 'us-east-1') {
        this.exec(`aws s3api create-bucket --bucket ${bucketName}`);
      } else {
        this.exec(`aws s3api create-bucket --bucket ${bucketName} --region ${region} --create-bucket-configuration LocationConstraint=${region}`);
      }
      
      // Enable versioning
      this.exec(`aws s3api put-bucket-versioning --bucket ${bucketName} --versioning-configuration Status=Enabled`);
      
      // Enable encryption
      this.exec(`aws s3api put-bucket-encryption --bucket ${bucketName} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'`);
      
      // Add lifecycle policy for old versions
      const lifecyclePolicy = {
        Rules: [{
          ID: 'terraform-state-cleanup',
          Status: 'Enabled',
          NoncurrentVersionExpiration: {
            NoncurrentDays: 90
          }
        }]
      };
      
      this.exec(`aws s3api put-bucket-lifecycle-configuration --bucket ${bucketName} --lifecycle-configuration '${JSON.stringify(lifecyclePolicy)}'`);
      
      this.logSuccess(`Created S3 bucket: ${bucketName} with versioning and encryption`);
    }

    return { bucketName, region };
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

    // Delete any existing access keys and create new ones
    this.log(`Managing access keys for: ${userName}`);
    
    // List existing access keys
    try {
      const existingKeys = this.exec(`aws iam list-access-keys --user-name ${userName} --query 'AccessKeyMetadata[].AccessKeyId' --output text`, true);
      
      if (existingKeys.trim()) {
        const keyIds = existingKeys.trim().split(/\s+/);
        this.log(`Found ${keyIds.length} existing access key(s), removing them...`);
        
        for (const keyId of keyIds) {
          try {
            this.exec(`aws iam delete-access-key --user-name ${userName} --access-key-id ${keyId}`, true);
            this.logSuccess(`Deleted existing access key: ${keyId}`);
          } catch (error) {
            this.logWarning(`Could not delete access key ${keyId}: ${error}`);
          }
        }
      }
    } catch {
      // User might not exist yet, which is fine
    }

    // Create new access keys
    this.log(`Creating new access keys for: ${userName}`);
    let accessKey: string;
    let secretKey: string;

    try {
      const keyOutput = this.exec(`aws iam create-access-key --user-name ${userName} --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text`, true);
      [accessKey, secretKey] = keyOutput.split('\t');
      
      this.logSuccess(`Created new access keys for: ${userName}`);
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

    // Validate GitHub authentication before attempting operations
    try {
      this.exec('gh auth status', true);
    } catch (error) {
      this.logWarning('GitHub authentication required. Run: gh auth login');
      this.logWarning('Skipping template cleanup issue creation');
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
- [ ] \`platform/config.*.example\` - Example configuration files
- [ ] \`initial-setup.sh\` - Legacy setup script (if present)
- [ ] Template documentation that's no longer needed

### Generated Configuration to Review
- [ ] \`manifests/\` - Kubernetes manifests (verify all placeholders replaced)
- [ ] \`platform/\` - CDKTF infrastructure code
- [ ] GitHub repository secrets (verify all are set correctly)
- [ ] DNS records (set up domain verification as instructed)

### Optional Cleanup
- [ ] Remove \`.github/workflows/create-setup-issue.yml\` (this workflow)
- [ ] Update README.md to reflect your project instead of template
- [ ] Remove any unused applications from \`manifests/applications/\`
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
      // Create template-cleanup label if it doesn't exist
      try {
        this.exec('gh label create "template-cleanup" --description "Issues related to template cleanup and ejection" --color "5319e7"', true);
        this.log('Created template-cleanup label');
      } catch {
        // Label might already exist, continue silently
        this.log(`${colors.yellow}Label 'template-cleanup' already exists; skipping creation.${colors.reset}`);
      }

      // Use heredoc to avoid shell interpretation of backticks
      const command = `gh issue create --title "chore: complete template cleanup and ejection" --body "$(cat <<'EOF'
${issueBody}
EOF
)" --label "template-cleanup"`;
      
      const result = this.exec(command, true);
      if (result && typeof result === 'string') {
        this.logSuccess(`Created template cleanup issue: ${result.trim()}`);
      } else {
        this.logWarning('Failed to retrieve result from GitHub CLI command');
      }
      
    } catch (error: any) {
      this.logWarning('Failed to create template cleanup issue');
      
      // Provide specific error context
      if (error.message.includes('not found')) {
        this.logWarning('GitHub CLI (gh) not found. Install with: nix-shell -p github-cli');
      } else if (error.message.includes('permission') || error.message.includes('auth')) {
        this.logWarning('GitHub authentication issue. Run: gh auth login');
      } else if (error.message.includes('template-cleanup')) {
        this.logWarning('Label issue - this has been fixed for future runs');
      } else {
        this.logWarning(`Unexpected error: ${error.message}`);
      }
      
      this.logWarning('You can create the cleanup issue manually or re-run setup with proper authentication');
    }
  }

  private async ejectTemplate(): Promise<void> {
    this.logStep('Template Ejection Mode');
    
    this.log(`${colors.yellow}${colors.bold}⚠️ This will create a pull request to remove template-specific files${colors.reset}\n`);
    
    const filesToRemove = [
      'setup.ts',
      'platform/config.json.example',
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
      this.log(`\n${colors.yellow}${colors.bold}Create a PR to remove template files?${colors.reset}`);
      this.log(`Type 'yes' to continue, 'no' to cancel:`);
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const response = await new Promise<string>((resolve) => {
        rl.question('> ', (answer) => {
          rl.close();
          resolve(answer.trim().toLowerCase());
        });
      });

      if (response !== 'yes' && response !== 'y') {
        this.log(`${colors.yellow}Ejection cancelled${colors.reset}`);
        return;
      }
    }

    if (this.options.dryRun) {
      this.log(`${colors.yellow}[DRY-RUN] Would create PR to remove template files${colors.reset}`);
      return;
    }

    // Check if we're in a git repository
    try {
      this.exec('git rev-parse --git-dir', true);
    } catch {
      this.logError('Not in a git repository');
      return;
    }

    // Save current branch
    const currentBranch = this.exec('git rev-parse --abbrev-ref HEAD', true);

    // Create cleanup branch
    const branchName = 'chore/eject-template-artifacts';
    this.log(`\n${colors.blue}Creating branch: ${branchName}${colors.reset}`);
    
    try {
      // Check if branch already exists
      try {
        this.exec(`git rev-parse --verify ${branchName}`, true);
        this.logWarning(`Branch ${branchName} already exists`);
        
        // Ask to delete existing branch
        if (this.options.interactive && !this.options.assumeYes) {
          this.log(`Delete existing branch and create a new one? (y/N):`);
          
          const readline = await import('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const response = await new Promise<string>((resolve) => {
            rl.question('> ', (answer) => {
              rl.close();
              resolve(answer.trim().toLowerCase());
            });
          });
          
          if (response === 'y' || response === 'yes') {
            this.exec(`git branch -D ${branchName}`, true);
            this.logSuccess(`Deleted existing branch ${branchName}`);
          } else {
            this.logError('Cannot proceed with existing branch. Please delete it manually or choose a different name.');
            return;
          }
        } else {
          this.logError(`Branch ${branchName} already exists. Delete it first or use a different name.`);
          return;
        }
      } catch {
        // Branch doesn't exist, which is what we want
      }

      // Create and checkout new branch
      this.exec(`git checkout -b ${branchName}`, true);
      this.logSuccess(`Created and switched to branch: ${branchName}`);
    } catch (error) {
      this.logError(`Failed to create branch: ${error}`);
      return;
    }

    // Remove files
    this.log(`\n${colors.blue}Removing template files...${colors.reset}`);
    let removedCount = 0;
    const removedFiles: string[] = [];
    
    for (const file of filesToRemove) {
      if (existsSync(file)) {
        try {
          this.exec(`rm -f "${file}"`, true);
          this.logSuccess(`Removed ${file}`);
          removedFiles.push(file);
          removedCount++;
        } catch (error) {
          this.logError(`Failed to remove ${file}: ${error}`);
        }
      }
    }

    if (removedCount === 0) {
      this.logWarning('No files to remove');
      this.exec(`git checkout ${currentBranch}`, true);
      this.exec(`git branch -d ${branchName}`, true);
      return;
    }

    // Stage changes
    try {
      this.exec('git add -A', true);
      
      // Create commit
      const commitMessage = `chore: eject GitOps template artifacts

Removed template-specific files after successful setup:
${removedFiles.map(f => `- ${f}`).join('\n')}

Repository is now ready for independent development.`;
      
      this.exec(`git commit -m "${commitMessage}"`, true);
      this.logSuccess('Created commit');
    } catch (error) {
      this.logError(`Failed to commit: ${error}`);
      this.exec(`git checkout ${currentBranch}`, true);
      this.exec(`git branch -D ${branchName}`, true);
      return;
    }

    // Push branch
    try {
      this.exec(`git push -u origin ${branchName}`, true);
      this.logSuccess(`Pushed branch to origin`);
    } catch (error) {
      this.logError(`Failed to push branch: ${error}`);
      this.exec(`git checkout ${currentBranch}`, true);
      return;
    }

    // Create PR using gh CLI
    this.log(`\n${colors.blue}Creating pull request...${colors.reset}`);
    
    const prBody = `## Template Ejection

This PR removes template-specific files after repository setup is complete.

### Files Removed
${removedFiles.map(f => `- \`${f}\``).join('\n')}

### Next Steps
1. Review the changes
2. Merge when ready to finalize template ejection
3. Update README.md and other documentation as needed

### Note
The following files may need manual updates:
${optionalFiles.filter(f => existsSync(f)).map(f => `- \`${f}\``).join('\n')}`;

    try {
      const prUrl = this.exec(`gh pr create --title "chore: eject GitOps template artifacts" --body "${prBody.replace(/"/g, '\\"')}" --head ${branchName}`, true);
      this.logSuccess('Created pull request');
      this.log(`\n${colors.green}Pull request URL: ${prUrl}${colors.reset}`);
    } catch (error) {
      this.logWarning(`Could not create PR automatically: ${error}`);
      this.log(`\n${colors.yellow}Create PR manually at:${colors.reset}`);
      this.log(`https://github.com/<owner>/<repo>/compare/${branchName}`);
    }

    // Return to original branch
    this.exec(`git checkout ${currentBranch}`, true);

    this.logStep('Ejection PR Created');
    this.log(`\n${colors.green}✓ Template ejection PR created successfully!${colors.reset}`);
    this.log(`\n${colors.yellow}Next steps:${colors.reset}`);
    this.log('1. Review the pull request');
    this.log('2. Merge when ready to remove template artifacts');
    this.log('3. Update README.md and other documentation as needed');
    this.log('\nThe template files will remain available until you merge the PR.');
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
      await this.checkPrerequisites();

      // Step 2: Show confirmation dialog with account details
      await this.showConfirmationDialog();

      // Step 3: Setup S3 bucket for Terraform state
      const s3Config = await this.setupS3StateBucket();

      // Step 4: Setup SES credentials
      const sesConfig = await this.setupSesCredentials();

      // Step 5: Set GitHub secrets
      const secrets: Record<string, string> = {
        PROJECT_NAME: this.config.project.name,
        DIGITALOCEAN_TOKEN: process.env.DIGITALOCEAN_TOKEN || '',
        TERRAFORM_STATE_BUCKET: s3Config.bucketName,
        TERRAFORM_STATE_REGION: s3Config.region,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
        SES_SMTP_USERNAME: sesConfig.username,
        SES_SMTP_PASSWORD: sesConfig.password,
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

      // Create PR if requested and changes exist
      if (this.shouldCreatePR()) {
        await this.createSetupPR();
      } else {
        this.log(`\n${colors.yellow}Next steps:${colors.reset}`);
        this.log('1. Run: npx tsx platform/src/main.ts (or use CDKTF CLI)');
        this.log('2. Wait for infrastructure deployment to complete');
        this.log('3. Access your applications at the configured domains');
      }

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

  private shouldCreatePR(): boolean {
    // Don't create PR in dry-run mode
    if (this.options.dryRun) {
      return false;
    }

    // Explicit --no-pr flag disables PR creation
    if (this.options.noPr) {
      return false;
    }

    // Explicit --create-pr flag enables PR creation
    if (this.options.createPr) {
      return true;
    }

    // Default behavior: create PR if not skipping GitHub
    return !this.options.skipGithub;
  }

  private async createSetupPR(): Promise<void> {
    this.logStep('Creating Setup PR');

    try {
      // Check if there are any git changes
      const status = this.exec('git status --porcelain', true);
      if (!status.trim()) {
        this.log('No changes to commit, skipping PR creation');
        return;
      }

      // Validate GitHub authentication
      try {
        this.exec('gh auth status', true);
      } catch (error) {
        this.logWarning('GitHub authentication required for PR creation. Run: gh auth login');
        this.logWarning('Skipping PR creation - you can manually create a PR later');
        return;
      }

      // Generate deterministic branch name based on project configuration
      const projectSlug = this.config.project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const finalBranchName = `setup/${projectSlug}-initial-configuration`;

      // Check if branch already exists and delete it (we want to recreate)
      try {
        this.exec(`git rev-parse --verify ${finalBranchName}`, true);
        this.log(`Branch ${finalBranchName} already exists, deleting...`);
        this.exec(`git branch -D ${finalBranchName}`, true);
      } catch {
        // Branch doesn't exist, which is fine
      }

      // Create and checkout new branch
      this.exec(`git checkout -b ${finalBranchName}`);
      this.log(`Created branch: ${finalBranchName}`);

      // Add all changes
      this.exec('git add .');

      // Create commit
      const commitMessage = this.generateCommitMessage();
      this.exec(`git commit -m "${commitMessage}"`);

      // Push branch
      this.exec(`git push -u origin ${finalBranchName}`);

      // Create PR
      const prDescription = this.generatePRDescription();
      const prCommand = `gh pr create --title "feat: initial repository setup and configuration" --body "$(cat <<'EOF'
${prDescription}
EOF
)"`;

      const prResult = this.exec(prCommand, true);
      
      if (prResult && typeof prResult === 'string') {
        const prUrl = prResult.trim();
        this.logSuccess(`Created setup PR: ${prUrl}`);
        this.log(`\n${colors.bold}${colors.green}🎉 Setup complete!${colors.reset}`);
        this.log(`${colors.blue}Next steps:${colors.reset}`);
        this.log(`1. Review the PR: ${prUrl}`);
        this.log(`2. Merge when ready to finalize setup`);
        this.log(`3. Deploy infrastructure using the workflows`);
      } else {
        this.logWarning('PR created but could not retrieve URL');
      }

    } catch (error: any) {
      this.logWarning('Failed to create setup PR');
      
      if (error.message.includes('not found')) {
        this.logWarning('GitHub CLI (gh) not found. Install with: nix-shell -p github-cli');
      } else if (error.message.includes('permission') || error.message.includes('auth')) {
        this.logWarning('GitHub authentication issue. Run: gh auth login');
      } else {
        this.logWarning(`Unexpected error: ${error.message}`);
      }
      
      this.logWarning('You can manually create a PR with the current changes');
    }
  }

  private generateCommitMessage(): string {
    const projectName = this.config.project.name;
    const domain = this.config.project.domain;
    return `feat: initial repository setup for ${projectName}

- Configured project for domain: ${domain}
- Set up GitHub repository secrets
- Generated platform configuration
- Completed GitOps template setup`;
  }

  private generatePRDescription(): string {
    const projectName = this.config.project.name;
    const domain = this.config.project.domain;
    const environment = this.config.environments[0];
    
    return `## Initial Repository Setup

This PR contains the initial configuration for **${projectName}** generated by the GitOps template setup process.

### Configuration Summary
- **Project Name:** ${projectName}
- **Domain:** ${domain}
- **Environment:** ${environment.name}
- **Region:** ${environment.cluster.region}
- **Cluster Size:** ${environment.cluster.nodeCount}x ${environment.cluster.nodeSize}

### Changes Included
- ✅ Generated \`platform/config.json\` with project configuration
- ✅ Configured GitHub repository secrets for deployment
- ✅ Set up infrastructure parameters for CDKTF
- ✅ Prepared GitOps manifests with project-specific values

### Next Steps
1. **Review this PR** to ensure all configuration is correct
2. **Merge this PR** to finalize the setup
3. **Deploy infrastructure** by running the deployment workflows
4. **Verify applications** are accessible at configured domains

### Infrastructure Deployment
After merging this PR:
- The \`terraform-deploy\` workflow will provision your DigitalOcean Kubernetes cluster
- The \`flux-bootstrap\` workflow will set up GitOps and deploy applications
- Your applications will be available at:
  - Auth: https://auth.${domain}
  - Cloud: https://cloud.${domain}
  - Chat: https://chat.${domain}
  - Mail: https://mail.${domain}

### Support
- 📖 [Deployment Guide](docs/DEPLOYMENT.md)
- 📖 [Application Setup](docs/APPLICATIONS.md)
- 🔧 [Configuration Reference](docs/CONFIGURATION.md)

---
*This PR was created automatically by the GitOps template setup process.*`;
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
      throw new SetupError(
        'Platform directory not found. Run this from the repository root.',
        'PLATFORM_NOT_FOUND'
      );
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
  --create-pr         Force creation of setup PR after completion
  --no-pr             Disable automatic PR creation
  --eject             Create PR to remove template artifacts (advanced)
  --verbose           Show detailed command output
  --help              Show this help message

EXAMPLES:
  npx tsx setup.ts                     # Run with automatic login prompts and confirmation
  npx tsx setup.ts --dry-run           # Preview what would be done
  npx tsx setup.ts --yes               # Auto-approve confirmation dialog
  npx tsx setup.ts --no-interactive    # Fail if credentials missing (CI mode)
  npx tsx setup.ts --skip-github       # Skip all GitHub setup
  npx tsx setup.ts --config config.ts  # Use TypeScript config file
  npx tsx setup.ts --create-pr         # Force creation of setup PR
  npx tsx setup.ts --no-pr             # Skip PR creation
  npx tsx setup.ts --eject             # Create PR to remove template files

This script sets up prerequisites for CDKTF deployment:
- AWS S3 bucket for Terraform state (with versioning and encryption)
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

REQUIRED ENVIRONMENT VARIABLES:
  DIGITALOCEAN_TOKEN     DigitalOcean API token
  AWS_ACCESS_KEY_ID      AWS access key
  AWS_SECRET_ACCESS_KEY  AWS secret access key
  GH_TOKEN              GitHub token with repo admin permissions (Codespaces)
  GITHUB_TOKEN          GitHub token with repo admin permissions (fallback)

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
      case '--create-pr':
        options.createPr = true;
        break;
      case '--no-pr':
        options.noPr = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
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