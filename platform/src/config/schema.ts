import { z } from 'zod';

export const EnvironmentSchema = z.object({
  name: z.enum(['staging', 'production']),
  cluster: z.object({
    region: z.string().min(1, 'Region is required'),
    nodeSize: z.string().min(1, 'Node size is required'),
    nodeCount: z.number().int().min(1, 'Node count must be at least 1'),
    minNodes: z.number().int().min(1).optional(),
    maxNodes: z.number().int().max(100).optional(),
    haControlPlane: z.boolean().default(false),
    version: z.string().optional()
  }),
  domain: z.string().regex(/^[a-z0-9.-]+$/, 'Invalid domain format')
}).refine(data => {
  // Validate that minNodes <= nodeCount <= maxNodes
  const { nodeCount, minNodes, maxNodes } = data.cluster;
  if (minNodes && minNodes > nodeCount) {
    return false;
  }
  if (maxNodes && maxNodes < nodeCount) {
    return false;
  }
  if (minNodes && maxNodes && minNodes > maxNodes) {
    return false;
  }
  return true;
}, {
  message: "minNodes must be <= nodeCount <= maxNodes"
});

export const ProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(50, 'Project name must be 50 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Project name must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string()
    .min(1, 'Domain is required')
    .regex(/^[a-z0-9.-]+$/, 'Invalid domain format'),
  email: z.string().email('Valid email address is required'),
  description: z.string().optional()
});

export const ConfigSchema = z.object({
  project: ProjectSchema,
  environments: z.array(EnvironmentSchema).min(1, 'At least one environment is required')
});

export type Environment = z.infer<typeof EnvironmentSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Config = z.infer<typeof ConfigSchema>;

// Validation helper
export function validateConfig(config: unknown): Config {
  return ConfigSchema.parse(config);
}

// Partial validation for step-by-step configuration
export function validatePartialConfig(config: unknown): Partial<Config> {
  return ConfigSchema.partial().parse(config);
}