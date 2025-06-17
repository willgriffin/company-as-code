export * from '../config/schema';

// Provider-specific types
export interface DigitalOceanConfig {
  token: string;
  spacesAccessKey?: string;
  spacesSecretKey?: string;
}

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repository: string;
}

// Deployment types
export interface DeploymentResult {
  success: boolean;
  message: string;
  outputs?: Record<string, any>;
  errors?: string[];
}

export interface ClusterInfo {
  name: string;
  region: string;
  endpoint: string;
  kubeconfig: string;
  nodeCount: number;
}

// CLI types
export interface CLIContext {
  config?: import('../config/schema').Config;
  verbose?: boolean;
  dryRun?: boolean;
}