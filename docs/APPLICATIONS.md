# Application Guide

This guide covers the applications deployed on the k3s multicloud GitOps platform, their configuration patterns, authentication integration, and operational details.

## Application Overview

### Platform Applications

| Application | Purpose | Subdomain | Authentication |
|-------------|---------|-----------|----------------|
| **Mattermost** | Team collaboration and messaging | `chat.DOMAIN` | Dex OIDC |
| **Nextcloud** | Cloud storage and productivity | `cloud.DOMAIN` | Dex OIDC |
| **Forgejo** | Git forge and code hosting | `git.DOMAIN` | Dex OIDC |
| **Homepage** | Dashboard and service overview | `home.DOMAIN` | OAuth2-Proxy |
| **AI Gateway (LiteLLM)** | AI model proxy and routing | `ai.DOMAIN` | OAuth2-Proxy |

### Per-Tenant Services

| Service | Purpose | Subdomain Pattern | Scope |
|---------|---------|-------------------|-------|
| **Kanidm** | Identity provider | `id.TENANT.DOMAIN` | Per-organization |
| **Stalwart Mail** | Email server | `mail.TENANT.DOMAIN` | Per-organization |

## Common Patterns

All applications on the platform share these common infrastructure patterns:

### Ingress

All applications use **NGINX Ingress** with standard Kubernetes Ingress resources:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  namespace: myapp
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 8080
```

### Secrets

All applications use **SOPS+age** encrypted secrets committed to the Git repository:

- `*.secret.template.yaml` -- Documents the required secret structure (plaintext, committed)
- `*.secret.enc.yaml` -- Contains encrypted secret values (encrypted, committed)

Flux decrypts secrets at reconciliation time using the `sops-age` key in the `flux-system` namespace.

### Databases

Applications requiring relational storage use **CloudNativePG** PostgreSQL clusters:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: myapp-postgres
  namespace: myapp
spec:
  instances: 3
  storage:
    size: 20Gi
    storageClass: local-path
```

### Authentication

Applications authenticate through one of two mechanisms:

- **Dex OIDC (native)**: Applications with built-in OIDC support connect directly to Dex
- **OAuth2-Proxy (external)**: Applications without native OIDC support are protected by OAuth2-Proxy as an Ingress auth sub-request

## Mattermost

### Overview

Mattermost provides team collaboration with channels, direct messaging, file sharing, and integrations. It connects to Dex for single sign-on.

### Architecture

- **Application**: Mattermost Team Edition deployment
- **Database**: Dedicated CloudNativePG PostgreSQL cluster
- **Authentication**: Dex OIDC via GitLab-compatible SSO provider configuration
- **Ingress**: NGINX Ingress at `chat.DOMAIN`
- **Storage**: Persistent volume for file uploads

### OIDC Integration

Mattermost authenticates through Dex using its GitLab SSO provider configuration:

```yaml
GitLabSettings:
  Enable: true
  Secret: "<OIDC_CLIENT_SECRET>"
  Id: "mattermost"
  Scope: "openid email profile"
  AuthEndpoint: "https://dex.example.com/auth"
  TokenEndpoint: "https://dex.example.com/token"
  UserApiEndpoint: "https://dex.example.com/userinfo"
```

### Key Features

- Single sign-on via Dex OIDC
- Automatic user provisioning on first login
- File attachment storage on persistent volumes
- Email notifications via SMTP
- Configurable team and channel settings

## Nextcloud

### Overview

Nextcloud provides cloud file storage, document collaboration, and productivity applications. It uses Dex for authentication, CloudNativePG for its database, and Redis for caching.

### Architecture

- **Application**: Nextcloud deployment with PHP-FPM
- **Database**: Dedicated CloudNativePG PostgreSQL cluster
- **Cache**: Redis instance via OpsTree Redis Operator
- **Authentication**: Dex OIDC via the Nextcloud OIDC Login app
- **Ingress**: NGINX Ingress at `cloud.DOMAIN`
- **Storage**: local-path persistent volumes for data

### OIDC Integration

Nextcloud integrates with Dex using the OIDC Login app:

```php
'oidc_login_provider_url' => 'https://dex.example.com',
'oidc_login_client_id' => 'nextcloud',
'oidc_login_client_secret' => getenv('OIDC_CLIENT_SECRET'),
'oidc_login_auto_redirect' => false,
'oidc_login_button_text' => 'Log in with SSO',
'oidc_login_attributes' => array(
  'id' => 'preferred_username',
  'name' => 'name',
  'mail' => 'email',
  'groups' => 'groups',
),
```

### Key Features

- Single sign-on via Dex OIDC with group mapping
- CloudNativePG high-availability database
- Redis distributed caching and file locking
- PHP-FPM performance tuning for large file uploads
- Persistent storage on local-path volumes

### Caching Configuration

Nextcloud uses Redis for:
- **Distributed cache**: Shared caching across replicas
- **File locking**: Transactional file locking for concurrent access
- **Session storage**: PHP session handling

## Forgejo

### Overview

Forgejo is a self-hosted Git forge providing code hosting, pull requests, issue tracking, CI/CD via Forgejo Actions, and package registries. It replaces external Git hosting dependencies.

### Architecture

- **Application**: Forgejo deployment
- **Database**: Dedicated CloudNativePG PostgreSQL cluster
- **Authentication**: Dex OIDC
- **Ingress**: NGINX Ingress at `git.DOMAIN`
- **Storage**: Persistent volume for Git repositories

### OIDC Integration

Forgejo supports native OIDC authentication configured to use Dex as the provider. Users authenticate through Dex and are automatically provisioned in Forgejo on first login.

### Key Features

- Git repository hosting with web interface
- Pull request and code review workflows
- Issue tracking and project management
- Forgejo Actions for CI/CD (compatible with GitHub Actions syntax)
- Package registries (container, npm, etc.)
- Single sign-on via Dex OIDC

## Homepage

### Overview

Homepage is a dashboard application that provides a unified view of all platform services and their status. It uses Kubernetes API widgets to display real-time information.

### Architecture

- **Application**: Homepage dashboard deployment
- **Authentication**: OAuth2-Proxy (Homepage does not have native OIDC)
- **Ingress**: NGINX Ingress at `home.DOMAIN` with auth sub-request to OAuth2-Proxy
- **Data source**: Kubernetes API for service discovery and status

### Authentication

Homepage is protected by OAuth2-Proxy configured as an Ingress auth annotation:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: homepage
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://oauth2.example.com/oauth2/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://oauth2.example.com/oauth2/start?rd=$scheme://$host$request_uri"
```

### Key Features

- Centralized service dashboard
- Kubernetes API widgets showing pod status and resource usage
- Bookmarks and quick links to all platform services
- Protected by OAuth2-Proxy for authenticated access only

## AI Gateway (LiteLLM)

### Overview

LiteLLM serves as an AI model proxy, providing a unified OpenAI-compatible API for routing requests to multiple AI providers (OpenAI, Anthropic, Cohere, and others).

### Architecture

- **Application**: LiteLLM proxy deployment
- **Authentication**: OAuth2-Proxy
- **Ingress**: NGINX Ingress at `ai.DOMAIN`
- **Configuration**: Model routing and API key management via ConfigMap and encrypted secrets

### Authentication

Access to the AI gateway is protected by OAuth2-Proxy, requiring Dex authentication before requests are forwarded to LiteLLM.

### Key Features

- Unified OpenAI-compatible API endpoint
- Multi-provider model routing (OpenAI, Anthropic, Cohere)
- API key management for upstream providers
- Request logging and usage tracking
- Rate limiting and budget controls

### Usage

Once authenticated, send requests using the standard OpenAI API format:

```bash
curl -X POST https://ai.example.com/chat/completions \
  -H "Authorization: Bearer <litellm-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Per-Tenant Services

### Multi-Tenancy Model

The platform supports per-organization (per-tenant) namespaces. Each tenant receives dedicated instances of identity and email services, providing strong isolation between organizations.

### Kanidm

#### Overview

Kanidm is a modern identity management server deployed per-tenant. Each organization gets its own Kanidm instance for managing users, groups, and authentication policies. Kanidm replaces the previous centralized Keycloak deployment with a lighter-weight, per-tenant approach.

#### Architecture

- **Deployment**: One Kanidm instance per tenant namespace
- **Database**: Embedded database (Kanidm uses its own storage)
- **Ingress**: NGINX Ingress at `id.TENANT.DOMAIN`
- **Integration**: Dex can federate identity from per-tenant Kanidm instances

#### Key Features

- Per-tenant user and group management
- OIDC/OAuth2 provider capabilities
- LDAP compatibility layer
- WebAuthn and passkey support
- RADIUS integration for network authentication
- Self-service password management

### Stalwart Mail

#### Overview

Stalwart Mail is a modern, all-in-one email server deployed per-tenant. Each organization gets its own email infrastructure with SMTP, IMAP, and JMAP support. It replaces the previous centralized Mailu deployment.

#### Architecture

- **Deployment**: One Stalwart Mail instance per tenant namespace
- **Ingress**: NGINX Ingress at `mail.TENANT.DOMAIN`
- **Protocols**: SMTP, IMAP, JMAP, ManageSieve
- **Authentication**: Integrates with the tenant's Kanidm instance

#### Key Features

- Per-tenant email isolation
- SMTP sending and receiving
- IMAP and JMAP for mail clients
- Built-in spam and phishing filtering
- DKIM, SPF, and DMARC support
- Web-based administration interface
- ManageSieve for server-side mail filtering

## Monitoring and Observability

All applications include Prometheus metrics integration:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: myapp
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

Application-specific metrics:
- **Mattermost**: Built-in metrics endpoint for message counts, active users, and response times
- **Nextcloud**: Server info API with Prometheus format for storage usage and active users
- **Forgejo**: Built-in metrics for repository counts, CI/CD job status, and user activity
- **LiteLLM**: Request counts, model usage, latency, and cost tracking

## Scaling and Resource Management

### Resource Profiles

Applications are configured with appropriate resource requests and limits:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 1000m
    memory: 2Gi
```

### Storage

All persistent storage uses the k3s default `local-path` StorageClass. Data durability is achieved through:
- CloudNativePG replication for databases
- Velero backups for persistent volumes
- Application-level data export capabilities

### Scale-to-Zero

Infrequently accessed services can be configured with Sablier for automatic scale-to-zero. When a request arrives, Sablier scales the deployment up and serves a loading page until the service is ready.

## Application Access Summary

| Application | URL | Auth Method |
|-------------|-----|-------------|
| Mattermost | `https://chat.DOMAIN` | Dex OIDC (native) |
| Nextcloud | `https://cloud.DOMAIN` | Dex OIDC (native) |
| Forgejo | `https://git.DOMAIN` | Dex OIDC (native) |
| Homepage | `https://home.DOMAIN` | OAuth2-Proxy |
| AI Gateway | `https://ai.DOMAIN` | OAuth2-Proxy |
| Dex | `https://dex.DOMAIN` | N/A (identity provider) |
| Grafana | `https://grafana.DOMAIN` | Dex OIDC (native) |
| Prometheus | `https://prometheus.DOMAIN` | OAuth2-Proxy |
| Kanidm | `https://id.TENANT.DOMAIN` | Native (per-tenant) |
| Stalwart Mail | `https://mail.TENANT.DOMAIN` | Kanidm (per-tenant) |

## Security

### Application Security

- **OIDC/SSO**: All applications authenticate through Dex or OAuth2-Proxy
- **TLS**: cert-manager issues and renews Let's Encrypt certificates for all Ingress resources
- **Network Policies**: Namespace-level network isolation
- **Encrypted secrets**: All credentials stored as SOPS-encrypted files in Git
- **Non-root containers**: Security-hardened container configurations where supported

### Per-Tenant Isolation

- **Namespace boundaries**: Each tenant operates in a dedicated Kubernetes namespace
- **Dedicated identity**: Per-tenant Kanidm prevents cross-tenant authentication
- **Dedicated email**: Per-tenant Stalwart Mail prevents cross-tenant email access
- **Resource quotas**: Configurable CPU, memory, and storage limits per tenant
- **Network policies**: Tenant namespaces are isolated from each other at the network level
