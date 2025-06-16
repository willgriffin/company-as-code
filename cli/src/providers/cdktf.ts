import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';

export interface CDKTFDeploymentResult {
  success: boolean;
  outputs?: Record<string, any>;
  errors?: string[];
}

export class CDKTFProvider {
  private platformPath: string;
  private verbose: boolean;

  constructor(platformPath = '../platform', verbose = false) {
    this.platformPath = platformPath;
    this.verbose = verbose;
  }

  async synth(): Promise<CDKTFDeploymentResult> {
    const spinner = ora('Synthesizing Terraform configuration...').start();
    
    try {
      const output = execSync('pnpm run synth', {
        cwd: this.platformPath,
        encoding: 'utf-8',
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      spinner.succeed('Terraform configuration synthesized');
      return { success: true };
    } catch (error) {
      spinner.fail('Failed to synthesize Terraform configuration');
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async plan(stackName?: string): Promise<CDKTFDeploymentResult> {
    const spinner = ora('Planning Terraform deployment...').start();
    
    try {
      const command = stackName ? `cdktf plan ${stackName}` : 'cdktf plan';
      const output = execSync(command, {
        cwd: this.platformPath,
        encoding: 'utf-8',
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      spinner.succeed('Terraform plan completed');
      return { success: true };
    } catch (error) {
      spinner.fail('Terraform plan failed');
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async deploy(stackName?: string): Promise<CDKTFDeploymentResult> {
    const spinner = ora('Deploying infrastructure...').start();
    
    try {
      // First synthesize
      const synthResult = await this.synth();
      if (!synthResult.success) {
        throw new Error('Synthesis failed');
      }

      spinner.text = 'Deploying with Terraform...';
      const command = stackName ? `cdktf deploy ${stackName}` : 'cdktf deploy';
      
      const output = execSync(`${command} --auto-approve`, {
        cwd: this.platformPath,
        encoding: 'utf-8',
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      // Extract outputs from Terraform
      const outputs = this.extractOutputs(output);

      spinner.succeed('Infrastructure deployed successfully');
      return { success: true, outputs };
    } catch (error) {
      spinner.fail('Deployment failed');
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async destroy(stackName?: string): Promise<CDKTFDeploymentResult> {
    const spinner = ora('Destroying infrastructure...').start();
    
    try {
      const command = stackName ? `cdktf destroy ${stackName}` : 'cdktf destroy';
      
      execSync(`${command} --auto-approve`, {
        cwd: this.platformPath,
        encoding: 'utf-8',
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      spinner.succeed('Infrastructure destroyed successfully');
      return { success: true };
    } catch (error) {
      spinner.fail('Destruction failed');
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async getStackOutputs(stackName: string): Promise<Record<string, any>> {
    try {
      const output = execSync(`cdktf output ${stackName}`, {
        cwd: this.platformPath,
        encoding: 'utf-8'
      });

      return JSON.parse(output);
    } catch (error) {
      throw new Error(`Failed to get stack outputs: ${error}`);
    }
  }

  async listStacks(): Promise<string[]> {
    try {
      const output = execSync('cdktf list', {
        cwd: this.platformPath,
        encoding: 'utf-8'
      });

      return output.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      throw new Error(`Failed to list stacks: ${error}`);
    }
  }

  private extractOutputs(terraformOutput: string): Record<string, any> {
    const outputs: Record<string, any> = {};
    
    // Simple extraction - in real implementation, would parse terraform output JSON
    const lines = terraformOutput.split('\n');
    let inOutputs = false;
    
    for (const line of lines) {
      if (line.includes('Outputs:')) {
        inOutputs = true;
        continue;
      }
      
      if (inOutputs && line.includes('=')) {
        const [key, value] = line.split('=').map(s => s.trim());
        if (key && value) {
          outputs[key] = value.replace(/"/g, '');
        }
      }
    }
    
    return outputs;
  }

  async validateConfiguration(): Promise<CDKTFDeploymentResult> {
    const spinner = ora('Validating CDKTF configuration...').start();
    
    try {
      // Check if platform directory exists
      if (!existsSync(this.platformPath)) {
        throw new Error(`Platform directory not found: ${this.platformPath}`);
      }

      // Check if cdktf.json exists
      const cdktfConfig = join(this.platformPath, 'cdktf.json');
      if (!existsSync(cdktfConfig)) {
        throw new Error('cdktf.json not found');
      }

      // Check if TypeScript builds
      execSync('pnpm run build', {
        cwd: this.platformPath,
        stdio: 'pipe'
      });

      spinner.succeed('Configuration is valid');
      return { success: true };
    } catch (error) {
      spinner.fail('Configuration validation failed');
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}