import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { SpacesBucket } from '@cdktf/provider-digitalocean/lib/spaces-bucket';
import { SpacesBucketPolicy } from '@cdktf/provider-digitalocean/lib/spaces-bucket-policy';
import { Config } from '@startup-gitops/shared';

export interface DigitalOceanSpacesStackProps {
  projectName: string;
  config: Config;
  region?: string;
}

export class DigitalOceanSpacesStack extends TerraformStack {
  public readonly terraformStateBucket: SpacesBucket;
  public readonly applicationDataBucket: SpacesBucket;

  constructor(scope: Construct, id: string, props: DigitalOceanSpacesStackProps) {
    super(scope, id);

    const { projectName, config, region = 'nyc3' } = props;

    // DigitalOcean provider
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
      spacesAccessId: process.env.SPACES_ACCESS_KEY_ID!,
      spacesSecretKey: process.env.SPACES_SECRET_ACCESS_KEY!,
    });

    // Terraform state bucket
    this.terraformStateBucket = new SpacesBucket(this, 'terraform-state', {
      name: `${projectName}-terraform-state`,
      region: region,
      acl: 'private',
      versioning: {
        enabled: true
      },
      lifecycleRule: [
        {
          id: 'terraform-state-cleanup',
          enabled: true,
          noncurrentVersionExpiration: {
            days: 90
          }
        }
      ]
    });

    // Application data bucket
    this.applicationDataBucket = new SpacesBucket(this, 'application-data', {
      name: `${projectName}-app-data`,
      region: region,
      acl: 'private',
      versioning: {
        enabled: true
      },
      lifecycleRule: [
        {
          id: 'backup-retention',
          enabled: true,
          noncurrentVersionExpiration: {
            days: 30
          }
        }
      ]
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
              AWS: '*'
            },
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject'
            ],
            Resource: `arn:aws:s3:::${projectName}-app-data/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'private'
              }
            }
          }
        ]
      })
    });

    // Outputs
    new TerraformOutput(this, 'terraform_state_bucket', {
      value: this.terraformStateBucket.name,
      description: 'Bucket for Terraform state storage'
    });

    new TerraformOutput(this, 'terraform_state_endpoint', {
      value: `https://${region}.digitaloceanspaces.com`,
      description: 'Endpoint for Terraform state bucket'
    });

    new TerraformOutput(this, 'application_data_bucket', {
      value: this.applicationDataBucket.name,
      description: 'Bucket for application data storage'
    });

    new TerraformOutput(this, 'application_data_endpoint', {
      value: `https://${this.applicationDataBucket.name}.${region}.digitaloceanspaces.com`,
      description: 'Endpoint for application data bucket'
    });
  }
}