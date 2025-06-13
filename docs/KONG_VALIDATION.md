# Kong Gateway Validation Guide

This document provides comprehensive testing and validation procedures for the Kong Gateway implementation replacing Traefik in this GitOps repository.

> **Note for Template Users**: If you created this repository from the GitOps template, it has been automatically initialized with processed YAML files. You can use standard Flux CLI tools directly without template processing.

## Overview

The Kong Gateway implementation includes:
- **Kong Gateway** in DB-less mode using Gateway API
- **Keycloak OIDC** authentication for all services
- **LiteLLM proxy** for AI service access with expense tracking
- **HTTPRoute resources** for all applications and monitoring tools
- **Custom expense tracker** service for AI usage monitoring

## Validation Phases

### Phase 1: Configuration Validation (Pre-Deployment)

Run configuration validation without requiring a live cluster:

```bash
./scripts/validate-kong-deployment --check-config
```

**For Template Repository Development:**
If you're working on the template itself (not a repository created from it), use:

```bash
./scripts/validate-kong-yaml  # Validates template syntax
```

This validates:
- ✅ Kong Operator HelmRelease configuration
- ✅ Kong Gateway resource definition
- ✅ HTTPRoute resources for all services
- ✅ Plugin configurations (OIDC, metrics, rate limiting)
- ✅ LiteLLM AI Gateway configuration
- ✅ Secret templates and Kustomization files

### Phase 2: Deployment Validation (Post-Deployment)

After deploying to a Kubernetes cluster, validate the running system:

```bash
# Full validation suite
./scripts/validate-kong-deployment --all

# Individual test suites
./scripts/validate-kong-deployment --test-connectivity
./scripts/validate-kong-deployment --test-auth
./scripts/validate-kong-deployment --test-ai
./scripts/validate-kong-deployment --test-monitoring
```

## Test Categories

### 1. Connectivity Tests (`--test-connectivity`)

**Kong Gateway Deployment:**
- ✅ `kong-system` namespace exists
- ✅ Kong pods are running and healthy
- ✅ Kong Gateway resource is configured
- ✅ Redis cluster for session storage is operational

**HTTPRoute Configuration:**
- ✅ All service HTTPRoutes are created and accepted
- ✅ Routes for: grafana, nextcloud, mattermost, mailu, postal, sentry, jaeger, prometheus, keycloak, ai-gateway, knative

**DNS and TLS Integration:**
- ✅ External DNS configured for Gateway API HTTPRoute
- ✅ cert-manager configured for Gateway API challenges

### 2. Authentication Tests (`--test-auth`)

**Keycloak Integration:**
- ✅ KeycloakClient resource created for Kong Gateway
- ✅ OIDC client secret properly configured
- ✅ Kong OIDC plugin deployed and functional

**Authentication Flow Testing:**
```bash
# Test OIDC authentication flow (manual verification required)
curl -v https://grafana.yourdomain.com/
# Should redirect to Keycloak for authentication
```

### 3. AI Gateway Tests (`--test-ai`)

**LiteLLM Proxy:**
- ✅ LiteLLM proxy deployment running
- ✅ LiteLLM service accessible
- ✅ LiteLLM configuration with multi-provider support
- ✅ AI provider API keys configured (OpenAI, Anthropic, Cohere)

**Expense Tracker:**
- ✅ Expense tracker service running
- ✅ Webhook endpoints configured for LiteLLM integration
- ✅ Redis budget tracking operational

**AI Usage Testing:**
```bash
# Test AI proxy endpoint (requires valid API keys)
curl -X POST https://ai.yourdomain.com/chat/completions \
  -H "Authorization: Bearer your-litellm-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 4. Monitoring Tests (`--test-monitoring`)

**Prometheus Integration:**
- ✅ ServiceMonitor resources for Kong Gateway
- ✅ ServiceMonitor resources for expense tracker
- ✅ ServiceMonitor resources for LiteLLM proxy
- ✅ Kong metrics endpoint accessible

**Metrics Validation:**
```bash
# Check Kong metrics (requires port-forward)
kubectl port-forward -n kong-system svc/kong-admin 8001:8001
curl http://localhost:8001/metrics

# Check expense tracker metrics
kubectl port-forward -n kong-system svc/expense-tracker 8080:8080
curl http://localhost:8080/metrics
```

## Standard Flux CLI Usage

**For Repositories Created from Template:**
Your repository contains standard Kubernetes YAML files. Use normal Flux commands:

```bash
# Validate manifests
flux check --path flux/clusters/my-cluster/

# Dry run deployment
flux diff kustomization flux-system --path flux/clusters/my-cluster/

# Check for drift
flux get kustomizations

# Force reconciliation
flux reconcile kustomization apps
```

## Manual Validation Procedures

### 1. End-to-End Service Access

Test each service through Kong Gateway:

```bash
# Test service accessibility (replace with your domain from config.yaml)
services=(
  "grafana.yourdomain.com"
  "prometheus.yourdomain.com" 
  "nextcloud.yourdomain.com"
  "chat.yourdomain.com"
  "mail.yourdomain.com"
  "postal.yourdomain.com"
  "sentry.yourdomain.com"
  "tracing.yourdomain.com"
  "auth.yourdomain.com"
  "ai.yourdomain.com"
)

for service in "${services[@]}"; do
  echo "Testing $service..."
  curl -I "https://$service" || echo "Failed: $service"
done
```

### 2. OIDC Authentication Flow

1. **Access Protected Service:**
   ```bash
   curl -v https://grafana.yourdomain.com/
   ```
   Should redirect to Keycloak (`302` to auth.yourdomain.com)

2. **Keycloak Login:**
   - Access redirected Keycloak URL
   - Verify login page loads
   - Complete authentication

3. **Service Access:**
   - Verify redirect back to original service
   - Confirm authenticated access to service

### 3. AI Expense Tracking

1. **Make AI Request:**
   ```bash
   curl -X POST https://ai.yourdomain.com/chat/completions \
     -H "Authorization: Bearer sk-your-litellm-key" \
     -H "Content-Type: application/json" \
     -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

2. **Check Expense Tracking:**
   ```bash
   # Port-forward to expense tracker
   kubectl port-forward -n kong-system svc/expense-tracker 8080:8080
   
   # Check budget endpoint
   curl http://localhost:8080/budget/default/user
   ```

3. **Verify Metrics:**
   ```bash
   curl http://localhost:8080/metrics | grep ai_cost_total
   ```

## Troubleshooting Common Issues

### Kong Gateway Not Starting

```bash
# Check Kong pod logs
kubectl logs -n kong-system -l app.kubernetes.io/name=kong

# Common issues:
# - Missing secrets (kong-redis-secret, kong-oidc-secret)
# - Redis connection failures
# - Invalid DB-less configuration
```

### HTTPRoutes Not Working

```bash
# Check HTTPRoute status
kubectl get httproute -A

# Check Gateway status
kubectl get gateway kong-gateway -n kong-system -o yaml

# Check Kong ingress controller logs
kubectl logs -n kong-system deployment/kong-controller
```

### OIDC Authentication Failing

```bash
# Check KeycloakClient status
kubectl get keycloakclient kong-gateway -n kong-system -o yaml

# Verify OIDC secret
kubectl get secret kong-oidc-secret -n kong-system -o yaml

# Check Kong OIDC plugin configuration
kubectl get kongclusterplugin keycloak-oidc -o yaml
```

### LiteLLM Not Responding

```bash
# Check LiteLLM pod logs
kubectl logs -n kong-system deployment/litellm-proxy

# Check configuration
kubectl get configmap litellm-config -n kong-system -o yaml

# Verify API keys are set
kubectl get secret litellm-secrets -n kong-system -o yaml
```

## Performance Validation

### Load Testing

Use tools like `hey` or `ab` to test Kong Gateway performance:

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test Kong Gateway performance
hey -n 1000 -c 10 https://grafana.yourdomain.com/

# Test AI endpoint performance  
hey -n 100 -c 5 -H "Authorization: Bearer sk-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"test"}]}' \
  https://ai.yourdomain.com/chat/completions
```

### Resource Usage

Monitor Kong Gateway resource consumption:

```bash
# Check Kong pod resource usage
kubectl top pods -n kong-system

# Check memory and CPU limits
kubectl describe pods -n kong-system -l app.kubernetes.io/name=kong
```

## Security Validation

### TLS Certificate Verification

```bash
# Check TLS certificates for all services
echo | openssl s_client -connect grafana.yourdomain.com:443 2>/dev/null | openssl x509 -noout -text
```

### Rate Limiting Testing

```bash
# Test rate limiting (should get 429 after limit)
for i in {1..20}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://grafana.yourdomain.com/
done
```

### Authentication Bypass Testing

Ensure all protected routes require authentication:

```bash
# Try direct access without authentication (should redirect to Keycloak)
services=("grafana" "prometheus" "nextcloud")
for service in "${services[@]}"; do
  echo "Testing $service..."
  curl -I "https://$service.yourdomain.com/api/health" 2>/dev/null | head -1
done
```

## Success Criteria

The Kong Gateway implementation is considered successful when:

1. ✅ **All validation scripts pass** without errors
2. ✅ **All services accessible** through Kong Gateway with proper authentication
3. ✅ **OIDC authentication works** for all protected services
4. ✅ **AI proxy functions** with proper expense tracking
5. ✅ **Monitoring integration** collects metrics from all components
6. ✅ **DNS and TLS** work correctly for all domains
7. ✅ **Performance meets** or exceeds Traefik baseline
8. ✅ **Security controls** (rate limiting, authentication) function properly

## Next Steps

After successful validation:

1. **Phase 4**: Performance optimization and fine-tuning
2. **Documentation**: Update deployment guides
3. **Monitoring**: Set up alerting for Kong Gateway health
4. **Backup**: Ensure Kong configuration is included in backup schedules