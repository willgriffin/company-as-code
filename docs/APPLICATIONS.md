# Application Guide

This guide covers the enterprise applications included in the GitOps template, their advanced features, OIDC integration patterns, and configuration options.

## Application Overview

The template includes production-ready enterprise applications with advanced integration features:

| Application | Purpose | Key Features | OIDC Integration |
|-------------|---------|--------------|------------------|
| **Nextcloud** | Cloud storage & productivity | DigitalOcean Spaces primary storage, Redis caching | ✅ Full SSO |
| **Mattermost** | Team collaboration | Enterprise messaging, file sharing | ✅ GitLab SSO provider |
| **Keycloak** | Identity & access management | Central SSO, user/group management | ✅ Identity provider |
| **Mailu** | Email server suite | Full email stack, anti-spam, webmail | ✅ OAuth2 proxy |
| **Postal** | Alternative email server | Modern email platform, APIs | ✅ OAuth2 proxy |

## Nextcloud

### Enterprise Features

Nextcloud is configured as an enterprise-grade cloud storage platform with advanced features:

#### Primary Storage Configuration
- **DigitalOcean Spaces as Primary Storage**: Files stored directly in object storage (not local filesystem)
- **Local Caching**: Frequently accessed files cached locally for performance
- **Redis Integration**: Distributed caching and file locking

#### Database Architecture
- **High-Availability PostgreSQL**: 3-replica CloudNativePG cluster
- **Connection Pooling**: Optimized database connections
- **Performance Tuning**: Custom PostgreSQL parameters for Nextcloud workloads

#### OIDC Integration

Nextcloud integrates with Keycloak for single sign-on:

```php
# OIDC configuration in manifests/applications/nextcloud.yaml
'oidc_login_provider_url' => 'https://auth.example.com/realms/mycompany',
'oidc_login_client_id' => 'nextcloud',
'oidc_login_client_secret' => getenv('OIDC_CLIENT_SECRET'),
'oidc_login_auto_redirect' => false,
'oidc_login_button_text' => 'Log in with Example Project',
'oidc_login_attributes' => array (
  'id' => 'preferred_username',
  'name' => 'name',
  'mail' => 'email',
  'groups' => 'groups',
),
```

#### Features:
- **Group Mapping**: Keycloak groups automatically mapped to Nextcloud groups
- **Automatic User Creation**: Users created on first login
- **Profile Synchronization**: User attributes synced from Keycloak
- **Disable Local Authentication**: Users cannot change passwords locally

### Storage Configuration

#### Object Storage Setup
```yaml
# Primary storage configuration
objectstore:
  class: '\\OC\\Files\\ObjectStore\\S3'
  arguments:
    bucket: 'example-cluster-nextcloud'
    hostname: 'nyc3.digitaloceanspaces.com'
    key: getenv('S3_ACCESS_KEY')
    secret: getenv('S3_SECRET_KEY')
    use_ssl: true
    region: 'nyc3'
```

#### Local Caching
- **Config/Apps Volume**: Persistent storage for configuration and custom applications
- **Local Cache Volume**: High-performance caching for frequently accessed files
- **Bulk Storage**: Standard storage for less frequently accessed cached data

### Performance Optimization

#### PHP Configuration
```yaml
phpConfigs:
  uploadLimit.ini: |
    upload_max_filesize = 16G
    post_max_size = 16G
    max_input_time = 3600
    max_execution_time = 3600
  www.conf: |
    pm = dynamic
    pm.max_children = 120
    pm.start_servers = 12
    pm.min_spare_servers = 6
    pm.max_spare_servers = 18
```

#### Caching Configuration
- **APCu**: Local memory caching for PHP
- **Redis**: Distributed caching and file locking
- **Preview Generation**: Optimized image and document previews

### Scaling and High Availability

- **Horizontal Pod Autoscaler**: 2-6 replicas based on CPU/memory usage
- **LoadBalancer**: Kong Gateway with advanced routing
- **Database Clustering**: 3-replica PostgreSQL with automatic failover
- **Redis Clustering**: Distributed caching for sessions and locks

## Mattermost

### Enterprise Team Collaboration

Mattermost provides enterprise-grade team collaboration with advanced features:

#### OIDC Integration

Mattermost uses Keycloak as OIDC provider via GitLab SSO configuration:

```yaml
GitLabSettings:
  Enable: true
  Secret: $(GITLAB_SECRET)
  Id: "mattermost"
  Scope: "openid email profile"
  AuthEndpoint: "https://auth.example.com/realms/mycompany/protocol/openid-connect/auth"
  TokenEndpoint: "https://auth.example.com/realms/mycompany/protocol/openid-connect/token"
  UserApiEndpoint: "https://auth.example.com/realms/mycompany/protocol/openid-connect/userinfo"
```

#### Features:
- **Single Sign-On**: Seamless authentication via Keycloak
- **User Provisioning**: Automatic user creation on first login
- **Email Integration**: AWS SES for notifications and invitations
- **File Storage**: Persistent volumes for team file sharing

### Database Configuration

- **PostgreSQL Cluster**: Dedicated 3-replica cluster for Mattermost
- **Connection Pooling**: Optimized database connections with connection limits
- **Performance Tuning**: Custom PostgreSQL parameters for chat workloads

### Email Integration

```yaml
EmailSettings:
  SMTPServer: "email-smtp.us-east-1.amazonaws.com"
  SMTPPort: "587"
  SMTPUsername: $(SMTP_USERNAME)
  SMTPPassword: $(SMTP_PASSWORD)
  ConnectionSecurity: "STARTTLS"
  EnableSMTPAuth: true
```

### Team Configuration

- **Domain Restrictions**: Limit user registration to specific domains
- **Team Creation**: Configurable team creation permissions
- **User Limits**: Configurable maximum users per team
- **Custom Branding**: Site name and support contact customization

## Keycloak

### Identity and Access Management

Keycloak serves as the central identity provider for all applications:

#### Operator-Based Deployment

- **Keycloak Operator**: Automated lifecycle management
- **Realm Configuration**: Automated client and user setup
- **High Availability**: Multi-replica deployment with session replication

#### Client Configuration

Each application is configured as a Keycloak client:

```yaml
# Example client configuration for Nextcloud
clients:
  - clientId: nextcloud
    protocol: openid-connect
    publicClient: false
    redirectUris:
      - https://cloud.example.com/*
    webOrigins:
      - https://cloud.example.com
    defaultClientScopes:
      - openid
      - email
      - profile
      - groups
```

#### User Management

- **User Federation**: LDAP integration support
- **Group Management**: Hierarchical group structures
- **Role Mapping**: Application-specific role assignments
- **Password Policies**: Configurable password complexity

### Database Architecture

- **PostgreSQL Cluster**: High-availability database backend
- **Session Storage**: Database-backed session management
- **Backup Integration**: Automated database backups

## Email Servers

### Mailu Email Suite

Mailu provides a complete email server infrastructure:

#### Architecture Components

- **Front**: HTTP/HTTPS/SMTP/IMAP/POP3 proxy
- **Admin**: Web-based administration interface
- **Postfix**: SMTP server with relay support
- **Dovecot**: IMAP/POP3 server
- **Rspamd**: Advanced spam filtering
- **ClamAV**: Virus scanning
- **Roundcube**: Web-based email client

#### AWS SES Integration

Outbound email routing through AWS SES for improved deliverability:

```yaml
outboundRelay:
  enabled: true
  host: email-smtp.us-east-1.amazonaws.com
  port: 587
  authEnabled: true
  username: $(SMTP_USERNAME)
  password: $(SMTP_PASSWORD)
```

#### OAuth2 Proxy Integration

Webmail access protected by OAuth2 proxy for OIDC authentication:

```yaml
# OAuth2 proxy configuration
OAUTH2_PROXY_PROVIDER: "oidc"
OAUTH2_PROXY_OIDC_ISSUER_URL: "https://auth.example.com/realms/mycompany"
OAUTH2_PROXY_CLIENT_ID: "mailu"
OAUTH2_PROXY_UPSTREAM: "http://mailu-webmail.mailu.svc.cluster.local"
```

#### Features:
- **OIDC Authentication**: Single sign-on for webmail access
- **Spam Protection**: Multi-layer spam and virus filtering
- **High Availability**: Multi-replica deployment
- **Database Backend**: PostgreSQL for user and domain management

### Postal (Alternative Email Server)

Postal provides a modern alternative email platform:

#### Features
- **Modern Architecture**: Ruby-based email platform
- **REST APIs**: Programmatic email management
- **Web Interface**: Modern administrative interface
- **Message Tracking**: Detailed delivery tracking and analytics

#### Integration
- **OAuth2 Proxy**: OIDC authentication for administrative access
- **Database Backend**: PostgreSQL for message storage and tracking
- **SMTP Relay**: AWS SES integration for outbound delivery

## Kong Gateway Integration

### Advanced Routing

All applications use Kong Gateway for sophisticated routing:

#### HTTPRoute Configuration

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: nextcloud
  namespace: nextcloud
spec:
  parentRefs:
  - name: kong-gateway
    namespace: kong-system
  hostnames:
  - cloud.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: nextcloud
      port: 8080
```

#### Kong Plugins

Applications can use Kong plugins for enhanced functionality:

- **OIDC Plugin**: Direct OIDC authentication at gateway level
- **Rate Limiting**: Protection against abuse
- **Prometheus Metrics**: Application-level metrics collection
- **Request/Response Transformation**: Header manipulation and routing

### TLS Configuration

Automatic TLS certificate management for all applications:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: nextcloud-tls
spec:
  secretName: nextcloud-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - cloud.example.com
```

## Secret Management

### External Secrets Integration

All applications use External Secrets Operator for dynamic secret injection:

#### Secret Store Configuration

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: nextcloud-credentials
spec:
  secretStoreRef:
    name: digitalocean-secret-store
    kind: ClusterSecretStore
  target:
    name: nextcloud-credentials
    creationPolicy: Owner
  data:
  - secretKey: admin-password
    remoteRef:
      key: nextcloud-admin-password
```

#### Secret Types

- **Application Credentials**: Admin usernames and passwords
- **Database Credentials**: PostgreSQL connection details
- **OIDC Secrets**: Client secrets for SSO integration
- **SMTP Credentials**: Email server authentication
- **API Keys**: Third-party service authentication

## Monitoring and Observability

### Prometheus Integration

All applications include ServiceMonitor resources for metrics collection:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nextcloud
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: nextcloud
  endpoints:
  - port: http
    path: /ocs/v2.php/apps/serverinfo/api/v1/info
    params:
      format: ['prometheus']
```

### Application Metrics

- **Nextcloud**: Server info API with Prometheus format
- **Mattermost**: Built-in metrics endpoint
- **Keycloak**: Administrative metrics and user statistics
- **Email Servers**: SMTP/IMAP connection and message metrics

## Scaling and Resource Management

### Resource Profiles

Applications use standardized resource profiles from infrastructure configuration:

```yaml
# Example resource configuration
resources: "${infraConfig.resourceProfiles.large}"

# Expands to:
resources:
  requests:
    cpu: 1000m
    memory: 2Gi
  limits:
    cpu: 2000m
    memory: 4Gi
```

### Horizontal Pod Autoscaling

Most applications include HPA configuration:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 6
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Storage Classes

Applications use different storage classes based on performance requirements:

- **Fast SSD**: Database storage, frequent access files
- **Standard**: Configuration, logs, less frequent access
- **Bulk**: Large files, backups, archival storage

## Application Access URLs

Based on the default configuration, applications are accessible at:

- **Nextcloud**: https://cloud.example.com
- **Mattermost**: https://chat.example.com
- **Keycloak**: https://auth.example.com
- **Mailu Webmail**: https://webmail.example.com
- **Mailu Admin**: https://mailadmin.example.com
- **Email Protocols**: mail.example.com (SMTP/IMAP/POP3)

## Security Features

### Application Security

- **OIDC/SSO**: Single sign-on across all applications
- **TLS Everywhere**: Automatic SSL certificate management
- **Network Policies**: Pod-to-pod communication control
- **Secret Injection**: Runtime secret fetching (no secrets in containers)
- **Non-Root Containers**: Security-hardened container configurations

### Email Security

- **DKIM Signing**: Domain-based message authentication
- **SPF Records**: Sender policy framework validation
- **Anti-Spam**: Multi-layer spam and virus protection
- **OAuth2 Protection**: OIDC authentication for webmail access
- **Relay Authentication**: Secure SMTP relay through AWS SES

This application suite provides a complete enterprise collaboration platform with advanced security, scalability, and integration features suitable for production deployments.