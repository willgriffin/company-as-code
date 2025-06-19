import { describe, it, expect } from 'vitest';
import { validateConfig } from './schema';

describe('Config Schema Validation', () => {
  it('should validate a valid configuration', () => {
    const validConfig = {
      project: {
        name: 'test-project',
        domain: 'example.com',
        email: 'admin@example.com',
      },
      environments: [
        {
          name: 'production',
          cluster: {
            region: 'nyc3',
            nodeSize: 's-2vcpu-4gb',
            nodeCount: 3,
            haControlPlane: false,
          },
          domain: 'example.com',
        },
      ],
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should throw on invalid configuration', () => {
    const invalidConfig = {
      project: {
        name: '',
        domain: 'invalid-domain',
        email: 'not-an-email',
      },
      environments: [],
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });
});
