import { execSync } from 'child_process';

export interface DigitalOceanClusterInfo {
  id: string;
  name: string;
  region: string;
  version: string;
  status: string;
  endpoint: string;
  ipv4: string;
  tags: string[];
  nodeCount: number;
}

export class DigitalOceanProvider {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async listClusters(): Promise<DigitalOceanClusterInfo[]> {
    try {
      const output = execSync(
        `doctl kubernetes cluster list --output json --access-token ${this.token}`,
        { encoding: 'utf-8' }
      );
      
      return JSON.parse(output).map((cluster: any) => ({
        id: cluster.id,
        name: cluster.name,
        region: cluster.region,
        version: cluster.version,
        status: cluster.status.state,
        endpoint: cluster.endpoint,
        ipv4: cluster.ipv4,
        tags: cluster.tags || [],
        nodeCount: cluster.node_pools?.reduce((sum: number, pool: any) => sum + pool.count, 0) || 0
      }));
    } catch (error) {
      throw new Error(`Failed to list clusters: ${error}`);
    }
  }

  async getCluster(nameOrId: string): Promise<DigitalOceanClusterInfo | null> {
    const clusters = await this.listClusters();
    return clusters.find(c => c.id === nameOrId || c.name === nameOrId) || null;
  }

  async getKubeconfig(nameOrId: string): Promise<string> {
    try {
      const output = execSync(
        `doctl kubernetes cluster kubeconfig show ${nameOrId} --access-token ${this.token}`,
        { encoding: 'utf-8' }
      );
      return output;
    } catch (error) {
      throw new Error(`Failed to get kubeconfig: ${error}`);
    }
  }

  async saveKubeconfig(nameOrId: string, path?: string): Promise<void> {
    try {
      const saveFlag = path ? `--set-current-context ${path}` : '';
      execSync(
        `doctl kubernetes cluster kubeconfig save ${nameOrId} ${saveFlag} --access-token ${this.token}`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      throw new Error(`Failed to save kubeconfig: ${error}`);
    }
  }

  async listRegions(): Promise<Array<{slug: string, name: string}>> {
    try {
      const output = execSync(
        `doctl compute region list --output json --access-token ${this.token}`,
        { encoding: 'utf-8' }
      );
      
      return JSON.parse(output)
        .filter((region: any) => region.available)
        .map((region: any) => ({
          slug: region.slug,
          name: region.name
        }));
    } catch (error) {
      throw new Error(`Failed to list regions: ${error}`);
    }
  }

  async listNodeSizes(): Promise<Array<{slug: string, memory: number, vcpus: number, disk: number}>> {
    try {
      const output = execSync(
        `doctl compute size list --output json --access-token ${this.token}`,
        { encoding: 'utf-8' }
      );
      
      return JSON.parse(output)
        .filter((size: any) => size.available)
        .map((size: any) => ({
          slug: size.slug,
          memory: size.memory,
          vcpus: size.vcpus,
          disk: size.disk
        }));
    } catch (error) {
      throw new Error(`Failed to list node sizes: ${error}`);
    }
  }
}