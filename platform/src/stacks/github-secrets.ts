import { Construct } from 'constructs';
import { TerraformStack, S3Backend } from 'cdktf';
import { GithubProvider } from '@cdktf/provider-github/lib/provider';
import { ActionsSecret } from '@cdktf/provider-github/lib/actions-secret';
import { CodespacesSecret } from '@cdktf/provider-github/lib/codespaces-secret';
import { Config } from '../config/schema';

export interface GitHubSecretsStackProps {
  projectName: string;
  config: Config;
  repository: string;
  secrets: Record<string, string>;
}

export class GitHubSecretsStack extends TerraformStack {
  public readonly actionSecrets: ActionsSecret[];
  public readonly codespaceSecrets: CodespacesSecret[];

  constructor(scope: Construct, id: string, props: GitHubSecretsStackProps) {
    super(scope, id);

    const { projectName, repository, secrets } = props;

    // Configure S3 backend for Terraform state
    new S3Backend(this, {
      bucket: process.env.TERRAFORM_STATE_BUCKET!,
      key: `${projectName}/github-secrets.tfstate`,
      region: process.env.TERRAFORM_STATE_REGION!,
      encrypt: true,
    });

    // GitHub provider
    // Extract owner and repo name from repository path
    const [owner, repoName] = repository.split('/');

    new GithubProvider(this, 'github', {
      token: process.env.GITHUB_TOKEN!,
      owner: owner,
    });

    // Create action secrets
    // When owner is set on provider, repository should only be the repo name
    this.actionSecrets = Object.entries(secrets).map(([key, value]) => {
      return new ActionsSecret(this, `secret-${key.toLowerCase()}`, {
        repository: repoName,
        secretName: key,
        plaintextValue: value,
      });
    });

    // Create codespace secrets - only KUBECONFIG is needed in codespaces
    this.codespaceSecrets = [];
    if (secrets.KUBECONFIG) {
      this.codespaceSecrets.push(
        new CodespacesSecret(this, 'codespace-secret-kubeconfig', {
          repository: repoName,
          secretName: 'KUBECONFIG',
          plaintextValue: secrets.KUBECONFIG,
        })
      );
    }
  }

  static createSecretsMap(props: {
    kubeconfig: string;
    digitalOceanToken: string;
    terraformStateBucket: string;
    terraformStateRegion: string;
    awsAccessKey?: string;
    awsSecretKey?: string;
    sesSmtpUsername?: string;
    sesSmtpPassword?: string;
    nextcloudBucketAccessKeyId?: string;
    nextcloudBucketSecretAccessKey?: string;
    nextcloudBucketName?: string;
  }): Record<string, string> {
    const secrets: Record<string, string> = {
      KUBECONFIG: props.kubeconfig,
      DIGITALOCEAN_TOKEN: props.digitalOceanToken,
      TERRAFORM_STATE_BUCKET: props.terraformStateBucket,
      TERRAFORM_STATE_REGION: props.terraformStateRegion,
    };

    if (props.awsAccessKey && props.awsSecretKey) {
      secrets.AWS_ACCESS_KEY_ID = props.awsAccessKey;
      secrets.AWS_SECRET_ACCESS_KEY = props.awsSecretKey;
    }

    if (props.sesSmtpUsername && props.sesSmtpPassword) {
      secrets.SES_SMTP_USERNAME = props.sesSmtpUsername;
      secrets.SES_SMTP_PASSWORD = props.sesSmtpPassword;
    }

    if (
      props.nextcloudBucketAccessKeyId &&
      props.nextcloudBucketSecretAccessKey &&
      props.nextcloudBucketName
    ) {
      secrets.NEXTCLOUD_BUCKET_ACCESS_KEY_ID = props.nextcloudBucketAccessKeyId;
      secrets.NEXTCLOUD_BUCKET_SECRET_ACCESS_KEY = props.nextcloudBucketSecretAccessKey;
      secrets.NEXTCLOUD_BUCKET_NAME = props.nextcloudBucketName;
    }

    return secrets;
  }
}
