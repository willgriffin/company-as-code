import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SesDomainIdentity } from '@cdktf/provider-aws/lib/ses-domain-identity';
import { SesDomainDkim } from '@cdktf/provider-aws/lib/ses-domain-dkim';
import { SesConfigurationSet } from '@cdktf/provider-aws/lib/ses-configuration-set';
import { IamUser } from '@cdktf/provider-aws/lib/iam-user';
import { IamAccessKey } from '@cdktf/provider-aws/lib/iam-access-key';
import { IamUserPolicy } from '@cdktf/provider-aws/lib/iam-user-policy';
import { Config } from '../config/schema';

export interface AWSSESStackProps {
  projectName: string;
  config: Config;
  region?: string;
}

export class AWSSESStack extends TerraformStack {
  public readonly sesDomainIdentity: SesDomainIdentity;
  public readonly sesDomainDkim: SesDomainDkim;
  public readonly sesUser: IamUser;
  public readonly accessKey: IamAccessKey;

  constructor(scope: Construct, id: string, props: AWSSESStackProps) {
    super(scope, id);

    const { projectName, config, region = 'us-east-1' } = props;

    // AWS provider
    new AwsProvider(this, 'aws', {
      region,
      accessKey: process.env.AWS_ACCESS_KEY_ID!,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY!,
    });

    // SES Configuration Set
    new SesConfigurationSet(this, 'config-set', {
      name: `${projectName}-email-config`,
    });

    // Domain identity for SES
    this.sesDomainIdentity = new SesDomainIdentity(this, 'domain-identity', {
      domain: config.project.domain,
    });

    // DKIM configuration
    this.sesDomainDkim = new SesDomainDkim(this, 'domain-dkim', {
      domain: this.sesDomainIdentity.domain,
    });

    // IAM user for SMTP
    this.sesUser = new IamUser(this, 'ses-smtp-user', {
      name: `${projectName}-ses-smtp`,
      path: '/ses/',
    });

    // IAM policy for SES sending
    new IamUserPolicy(this, 'ses-smtp-policy', {
      name: 'SESSendingPolicy',
      user: this.sesUser.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ses:SendEmail', 'ses:SendRawEmail'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'ses:FromAddress': [
                  `noreply@${config.project.domain}`,
                  `admin@${config.project.domain}`,
                  config.project.email,
                ],
              },
            },
          },
        ],
      }),
    });

    // Access key for SMTP
    this.accessKey = new IamAccessKey(this, 'ses-access-key', {
      user: this.sesUser.name,
    });

    // Outputs
    new TerraformOutput(this, 'ses_domain_identity', {
      value: this.sesDomainIdentity.domain,
      description: 'SES verified domain identity',
    });

    new TerraformOutput(this, 'ses_dkim_tokens', {
      value: this.sesDomainDkim.dkimTokens,
      description: 'DKIM tokens for DNS configuration',
    });

    new TerraformOutput(this, 'ses_smtp_username', {
      value: this.accessKey.id,
      description: 'SMTP username for SES',
    });

    new TerraformOutput(this, 'ses_smtp_password', {
      value: this.accessKey.sesSmtpPasswordV4,
      sensitive: true,
      description: 'SMTP password for SES',
    });

    new TerraformOutput(this, 'ses_smtp_endpoint', {
      value: `email-smtp.${region}.amazonaws.com`,
      description: 'SES SMTP endpoint',
    });
  }
}
