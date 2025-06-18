import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfigurationV2 } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration-v2';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Config } from '../config/schema';

export interface AWSS3StateStackProps {
  projectName: string;
  config: Config;
  region?: string;
}

export class AWSS3StateStack extends TerraformStack {
  public readonly stateBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: AWSS3StateStackProps) {
    super(scope, id);

    const { projectName, region = 'us-east-1' } = props;

    // AWS provider
    new AwsProvider(this, 'aws', {
      region: region
    });

    // Create S3 bucket for Terraform state
    this.stateBucket = new S3Bucket(this, 'terraform-state', {
      bucket: `${projectName}-terraform-state`,
      
      // Important: Prevent accidental deletion
      lifecycle: {
        preventDestroy: true
      },
      
      tags: {
        Name: `${projectName}-terraform-state`,
        Purpose: 'Terraform state storage',
        ManagedBy: 'CDKTF'
      }
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'terraform-state-versioning', {
      bucket: this.stateBucket.id,
      versioningConfiguration: {
        status: 'Enabled'
      }
    });

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'terraform-state-encryption', {
      bucket: this.stateBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256'
        }
      }]
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'terraform-state-public-access-block', {
      bucket: this.stateBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // Lifecycle rule to clean up old versions
    new S3BucketLifecycleConfigurationV2(this, 'terraform-state-lifecycle', {
      bucket: this.stateBucket.id,
      rule: [{
        id: 'cleanup-old-versions',
        status: 'Enabled',
        noncurrentVersionExpiration: {
          noncurrentDays: 90
        }
      }]
    });

    // Configure S3 backend for this stack
    new S3Backend(this, {
      bucket: this.stateBucket.bucket,
      key: `cdktf/${id}.tfstate`,
      region: region,
      encrypt: true
    });

    // Outputs
    new TerraformOutput(this, 'terraform_state_bucket', {
      value: this.stateBucket.bucket,
      description: 'S3 bucket for Terraform state storage'
    });

    new TerraformOutput(this, 'terraform_state_region', {
      value: region,
      description: 'AWS region for Terraform state bucket'
    });
  }
}