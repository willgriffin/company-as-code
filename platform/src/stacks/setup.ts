import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, S3Backend } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { SpacesKey } from '@cdktf/provider-digitalocean/lib/spaces-key';
import { Config } from '../config/schema';

export interface SetupStackProps {
  projectName: string;
  config: Config;
}

export class SetupStack extends TerraformStack {
  public readonly spacesKey: SpacesKey;

  constructor(scope: Construct, id: string, props: SetupStackProps) {
    super(scope, id);

    const { projectName } = props;

    // Configure S3 backend for Terraform state
    new S3Backend(this, {
      bucket: process.env.TERRAFORM_STATE_BUCKET!,
      key: `${projectName}/setup.tfstate`,
      region: process.env.TERRAFORM_STATE_REGION!,
      encrypt: true,
    });

    // DigitalOcean provider - uses main token only for creating initial resources
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
    });

    // Create initial Spaces access key for infrastructure management
    // This key will be used by other stacks to create buckets and manage Spaces resources
    this.spacesKey = new SpacesKey(this, 'infrastructure-spaces-key', {
      name: `${projectName}-infrastructure-key`,
      grant: [
        {
          bucket: '', // Empty string grants access to all buckets and bucket creation
          permission: 'fullaccess',
        },
      ],
    });

    // Outputs for other stacks to use
    new TerraformOutput(this, 'spaces_access_key_id', {
      value: this.spacesKey.accessKey,
      sensitive: true,
      description: 'Spaces access key ID for infrastructure operations',
    });

    new TerraformOutput(this, 'spaces_secret_access_key', {
      value: this.spacesKey.secretKey,
      sensitive: true,
      description: 'Spaces secret access key for infrastructure operations',
    });
  }
}
