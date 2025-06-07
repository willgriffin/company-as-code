# Dependency Matrix

This document outlines the actual dependencies between components for reference.

## Core Infrastructure

### Required by All Applications
- **traefik** - Ingress controller for external access
- **cert-manager-post-deploy** - TLS certificates (depends on cert-manager-deploy)

### Optional Dependencies
- **external-dns** - Automatic DNS management (independent)

## Operators

### CloudNativePG
**Required by:**
- mattermost (PostgreSQL database)
- nextcloud (PostgreSQL database)  
- keycloak (PostgreSQL database)
- mailu (PostgreSQL database)

### Redis Operator
**Required by:**
- nextcloud (Redis cache)
- mailu (Redis for OAuth2 proxy sessions)

**Not required by:**
- mattermost (no cache needed)

### Keycloak Operator
**Required by:**
- keycloak (identity provider instance)

## Services

### Keycloak
**Required by:**
- mattermost (OAuth integration)
- nextcloud (OIDC integration) 
- mailu (OAuth integration)

**Dependencies:**
- traefik (ingress access)
- cert-manager-post-deploy (TLS)
- keycloak-operator (CRDs)
- cloudnativepg (database)

## Applications

### Mattermost
**Dependencies:**
- traefik (ingress)
- cert-manager-post-deploy (TLS)
- cloudnativepg (PostgreSQL)
- keycloak (OAuth - could be made optional)

### Nextcloud  
**Dependencies:**
- traefik (ingress)
- cert-manager-post-deploy (TLS)
- cloudnativepg (PostgreSQL)
- redis-operator (cache)
- keycloak (OIDC - could be made optional)

### Mailu
**Dependencies:**
- traefik (ingress)
- cert-manager-post-deploy (TLS)
- cloudnativepg (PostgreSQL database)
- redis-operator (Redis for OAuth2 proxy sessions)
- keycloak (OAuth authentication)

## Benefits of Granular Dependencies

1. **Fault Isolation** - Redis failure doesn't affect Mattermost
2. **Operational Consistency** - All applications use the same database and cache operators
3. **Unified Backup Strategy** - CloudNativePG provides consistent backup across all PostgreSQL instances
4. **Selective Deployment** - Can deploy individual applications as dependencies become ready
5. **Clear Troubleshooting** - Dependency failures are scoped to actual users
6. **Standardized Monitoring** - All databases and caches use the same monitoring approach