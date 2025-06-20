import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { SpacesBucket } from '@cdktf/provider-digitalocean/lib/spaces-bucket';
import { SpacesBucketPolicy } from '@cdktf/provider-digitalocean/lib/spaces-bucket-policy';
import { SpacesKey } from '@cdktf/provider-digitalocean/lib/spaces-key';
import { Config } from '../config/schema';

export interface DigitalOceanSpacesStackProps {
  projectName: string;
  config: Config;
  region?: string;
}

export class DigitalOceanSpacesStack extends TerraformStack {
  public readonly applicationDataBucket: SpacesBucket;
  public readonly spacesKey: SpacesKey;

  constructor(scope: Construct, id: string, props: DigitalOceanSpacesStackProps) {
    super(scope, id);

    const { projectName, region = 'nyc3' } = props;

    // DigitalOcean provider - uses main token only
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
    });

    // Application data bucket using the main provider (no separate Spaces credentials needed)
    this.applicationDataBucket = new SpacesBucket(this, 'application-data', {
      name: `${projectName}-app-data`,
      region: region,
      acl: 'private',
      versioning: {
        enabled: true,
      },
      lifecycleRule: [
        {
          id: 'backup-retention',
          enabled: true,
          noncurrentVersionExpiration: {
            days: 30,
          },
        },
      ],
    });

    // Create Spaces access key for application access after bucket exists
    this.spacesKey = new SpacesKey(this, 'spaces-key', {
      name: `${projectName}-app-access-key`,
      grant: [
        {
          bucket: this.applicationDataBucket.name,
          permission: 'fullaccess',
        },
      ],
    });

    // Bucket policy for application access
    new SpacesBucketPolicy(this, 'app-data-policy', {
      region: region,
      bucket: this.applicationDataBucket.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'ApplicationAccess',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `arn:aws:s3:::${projectName}-app-data/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'private',
              },
            },
          },
        ],
      }),
    });

    // Outputs
    new TerraformOutput(this, 'application_data_bucket', {
      value: this.applicationDataBucket.name,
      description: 'Bucket for application data storage',
    });

    new TerraformOutput(this, 'application_data_endpoint', {
      value: `https://${this.applicationDataBucket.name}.${region}.digitaloceanspaces.com`,
      description: 'Endpoint for application data bucket',
    });

    new TerraformOutput(this, 'spaces_access_key_id', {
      value: this.spacesKey.accessKey,
      sensitive: true,
      description: 'Spaces access key ID for application access',
    });

    new TerraformOutput(this, 'spaces_secret_access_key', {
      value: this.spacesKey.secretKey,
      sensitive: true,
      description: 'Spaces secret access key for application access',
    });
  }
}
