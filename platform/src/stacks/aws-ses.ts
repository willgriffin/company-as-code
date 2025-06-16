import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SesEmailIdentity } from '@cdktf/provider-aws/lib/ses-email-identity';
import { SesEmailIdentityDkimAttributes } from '@cdktf/provider-aws/lib/ses-email-identity-dkim-attributes';
import { SesConfigurationSet } from '@cdktf/provider-aws/lib/ses-configuration-set';
import { IamUser } from '@cdktf/provider-aws/lib/iam-user';
import { IamAccessKey } from '@cdktf/provider-aws/lib/iam-access-key';
import { IamUserPolicy } from '@cdktf/provider-aws/lib/iam-user-policy';
import { Config } from '@startup-gitops/shared';

export interface AWSSESStackProps {
  projectName: string;
  config: Config;
  region?: string;
}

export class AWSSESStack extends TerraformStack {
  public readonly sesEmailIdentity: SesEmailIdentity;
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
    const configSet = new SesConfigurationSet(this, 'config-set', {
      name: `${projectName}-email-config`,
    });

    // Email identity for domain
    this.sesEmailIdentity = new SesEmailIdentity(this, 'domain-identity', {
      email: config.project.domain,
      configurationSetName: configSet.name,
    });

    // DKIM attributes
    new SesEmailIdentityDkimAttributes(this, 'dkim-attributes', {
      emailIdentity: this.sesEmailIdentity.email,
      signingEnabled: true,
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
            Action: [
              'ses:SendEmail',
              'ses:SendRawEmail'
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'ses:FromAddress': [
                  `noreply@${config.project.domain}`,
                  `admin@${config.project.domain}`,
                  config.project.email
                ]
              }
            }
          }
        ]
      })
    });

    // Access key for SMTP
    this.accessKey = new IamAccessKey(this, 'ses-access-key', {
      user: this.sesUser.name,
    });

    // Outputs
    new TerraformOutput(this, 'ses_domain_identity', {
      value: this.sesEmailIdentity.email,
      description: 'SES verified domain identity'
    });

    new TerraformOutput(this, 'ses_smtp_username', {
      value: this.accessKey.id,
      description: 'SMTP username for SES'
    });

    new TerraformOutput(this, 'ses_smtp_password', {
      value: this.accessKey.sesSmtpPasswordV4,
      sensitive: true,
      description: 'SMTP password for SES'
    });

    new TerraformOutput(this, 'ses_smtp_endpoint', {
      value: `email-smtp.${region}.amazonaws.com`,
      description: 'SES SMTP endpoint'
    });
  }
}