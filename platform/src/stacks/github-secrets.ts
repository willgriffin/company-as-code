import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { GithubProvider } from '@cdktf/provider-github/lib/provider';
import { ActionsSecret } from '@cdktf/provider-github/lib/actions-secret';
import { Config } from '@startup-gitops/shared';

export interface GitHubSecretsStackProps {
  projectName: string;
  config: Config;
  repository: string;
  secrets: Record<string, string>;
}

export class GitHubSecretsStack extends TerraformStack {
  public readonly actionSecrets: ActionsSecret[];

  constructor(scope: Construct, id: string, props: GitHubSecretsStackProps) {
    super(scope, id);

    const { repository, secrets } = props;

    // GitHub provider
    new GithubProvider(this, 'github', {
      token: process.env.GITHUB_TOKEN!,
    });

    // Create action secrets
    this.actionSecrets = Object.entries(secrets).map(([key, value], index) => {
      return new ActionsSecret(this, `secret-${key.toLowerCase()}`, {
        repository,
        secretName: key,
        plaintextValue: value,
      });
    });
  }

  static createSecretsMap(props: {
    kubeconfig: string;
    digitalOceanToken: string;
    spacesAccessKey: string;
    spacesSecretKey: string;
    awsAccessKey?: string;
    awsSecretKey?: string;
    sesSmtpUsername?: string;
    sesSmtpPassword?: string;
  }): Record<string, string> {
    const secrets: Record<string, string> = {
      KUBECONFIG: props.kubeconfig,
      DIGITALOCEAN_TOKEN: props.digitalOceanToken,
      SPACES_ACCESS_KEY_ID: props.spacesAccessKey,
      SPACES_SECRET_ACCESS_KEY: props.spacesSecretKey,
    };

    if (props.awsAccessKey && props.awsSecretKey) {
      secrets.AWS_ACCESS_KEY_ID = props.awsAccessKey;
      secrets.AWS_SECRET_ACCESS_KEY = props.awsSecretKey;
    }

    if (props.sesSmtpUsername && props.sesSmtpPassword) {
      secrets.SES_SMTP_USERNAME = props.sesSmtpUsername;
      secrets.SES_SMTP_PASSWORD = props.sesSmtpPassword;
    }

    return secrets;
  }
}