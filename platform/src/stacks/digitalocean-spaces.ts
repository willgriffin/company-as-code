import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, S3Backend } from 'cdktf';
import { DigitaloceanProvider } from '@cdktf/provider-digitalocean/lib/provider';
import { SpacesBucket } from '@cdktf/provider-digitalocean/lib/spaces-bucket';
import { SpacesBucketPolicy } from '@cdktf/provider-digitalocean/lib/spaces-bucket-policy';
import { Config } from '../config/schema';

export interface DigitalOceanSpacesStackProps {
  projectName: string;
  config: Config;
  region?: string;
  spacesAccessKeyId: string;
  spacesSecretAccessKey: string;
}

export class DigitalOceanSpacesStack extends TerraformStack {
  public readonly applicationDataBucket: SpacesBucket;

  constructor(scope: Construct, id: string, props: DigitalOceanSpacesStackProps) {
    super(scope, id);

    const { projectName, region = 'nyc3', spacesAccessKeyId, spacesSecretAccessKey } = props;

    // Configure S3 backend for Terraform state
    new S3Backend(this, {
      bucket: process.env.TERRAFORM_STATE_BUCKET!,
      key: `${projectName}/spaces.tfstate`,
      region: process.env.TERRAFORM_STATE_REGION!,
      encrypt: true,
    });

    // DigitalOcean provider with Spaces credentials from setup stack
    new DigitaloceanProvider(this, 'digitalocean', {
      token: process.env.DIGITALOCEAN_TOKEN!,
      spacesAccessId: spacesAccessKeyId,
      spacesSecretKey: spacesSecretAccessKey,
    });

    // Application data bucket with a stable name
    const bucketName = `${projectName}-app-data`;
    this.applicationDataBucket = new SpacesBucket(this, 'application-data', {
      name: bucketName,
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
            Resource: `arn:aws:s3:::${bucketName}/*`,
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
  }
}
