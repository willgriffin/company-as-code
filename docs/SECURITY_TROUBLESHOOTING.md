# Security Troubleshooting Guide

This guide helps diagnose and resolve common security issues in your GitOps-managed Kubernetes environment.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Authorization Problems](#authorization-problems)
- [Certificate and TLS Errors](#certificate-and-tls-errors)
- [Network Policy Issues](#network-policy-issues)
- [Secret Management Problems](#secret-management-problems)
- [Security Scanning Failures](#security-scanning-failures)
- [Performance Impact](#performance-impact)
- [Common Security Misconfigurations](#common-security-misconfigurations)

## Authentication Issues

### Keycloak Login Failures

**Symptoms:**
- Users cannot log in
- "Invalid username or password" errors
- Redirect loops

**Diagnosis:**
```bash
# Check Keycloak pod status
kubectl get pods -n keycloak

# View Keycloak logs
kubectl logs -n keycloak deployment/keycloak -f

# Check realm configuration
kubectl exec -n keycloak deployment/keycloak -- \
  /opt/keycloak/bin/kcadm.sh get realms/master \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password $KEYCLOAK_ADMIN_PASSWORD
```

**Common Solutions:**

1. **Password Policy Conflicts**
   ```bash
   # Temporarily disable password policy for debugging
   kubectl exec -n keycloak deployment/keycloak -- \
     /opt/keycloak/bin/kcadm.sh update realms/master \
     -s 'passwordPolicy=""' \
     --server http://localhost:8080 \
     --realm master \
     --user admin \
     --password $KEYCLOAK_ADMIN_PASSWORD
   ```

2. **Session Cookie Issues**
   ```yaml
   # Update Keycloak configuration
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: keycloak-config
   data:
     KC_HOSTNAME_STRICT_HTTPS: "false"  # For debugging only
     KC_PROXY: "edge"
     KC_HTTP_ENABLED: "true"
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connectivity
   kubectl exec -n keycloak deployment/keycloak -- \
     nc -zv postgres-keycloak 5432
   ```

### OAuth2 Proxy Issues

**Symptoms:**
- 403 Forbidden errors
- Continuous redirect to login
- "Cookie too large" errors

**Diagnosis:**
```bash
# Check OAuth2 proxy logs
kubectl logs -n apps deployment/oauth2-proxy

# Verify configuration
kubectl get configmap -n apps oauth2-proxy-config -o yaml
```

**Solutions:**

1. **Cookie Size Issues**
   ```yaml
   # Increase cookie size limits in Kong
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: kong-config
   data:
     KONG_NGINX_HTTP_LARGE_CLIENT_HEADER_BUFFERS: "4 32k"
   ```

2. **Session Storage**
   ```yaml
   # Switch to Redis session storage
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: oauth2-proxy-config
   data:
     oauth2-proxy.cfg: |
       session_store_type = "redis"
       redis_connection_url = "redis://redis:6379"
   ```

## Authorization Problems

### RBAC Permission Denied

**Symptoms:**
- "Error from server (Forbidden)" messages
- Cannot perform expected operations
- Service account access issues

**Diagnosis:**
```bash
# Check current user permissions
kubectl auth can-i --list

# Check specific permission
kubectl auth can-i create pods -n production

# Review RBAC bindings
kubectl get rolebindings,clusterrolebindings -A | grep <username>

# Test service account permissions
kubectl auth can-i --as=system:serviceaccount:default:myapp create pods
```

**Solutions:**

1. **Missing Role Bindings**
   ```bash
   # Create role binding
   kubectl create rolebinding developer \
     --clusterrole=edit \
     --user=john@example.com \
     --namespace=production
   ```

2. **Incorrect Service Account**
   ```yaml
   # Ensure pod uses correct service account
   apiVersion: v1
   kind: Pod
   spec:
     serviceAccountName: myapp-sa
     automountServiceAccountToken: true
   ```

3. **Namespace Isolation**
   ```bash
   # Debug namespace access
   kubectl get namespaces --as=john@example.com
   ```

### Pod Security Standards Violations

**Symptoms:**
- Pods failing to start
- "Forbidden: violates PodSecurity" errors
- Admission webhook denials

**Diagnosis:**
```bash
# Check namespace labels
kubectl get namespace production --show-labels

# View pod security violations
kubectl describe pod <pod-name> -n production

# Check admission controller logs
kubectl logs -n kube-system deployment/pod-security-webhook
```

**Solutions:**

1. **Update Pod Security Context**
   ```yaml
   apiVersion: v1
   kind: Pod
   spec:
     securityContext:
       runAsNonRoot: true
       runAsUser: 1000
       fsGroup: 2000
       seccompProfile:
         type: RuntimeDefault
     containers:
     - name: app
       securityContext:
         allowPrivilegeEscalation: false
         readOnlyRootFilesystem: true
         capabilities:
           drop:
           - ALL
   ```

2. **Temporary Exception**
   ```yaml
   # Add exception label to namespace
   apiVersion: v1
   kind: Namespace
   metadata:
     name: legacy-app
     labels:
       pod-security.kubernetes.io/enforce: baseline
       pod-security.kubernetes.io/warn: restricted
   ```

## Certificate and TLS Errors

### cert-manager Issues

**Symptoms:**
- Certificate not ready
- TLS handshake failures
- Browser security warnings

**Diagnosis:**
```bash
# Check certificate status
kubectl get certificates -A

# View cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate details
kubectl describe certificate example-com -n apps

# View challenge status
kubectl get challenges -A
```

**Solutions:**

1. **DNS Challenge Failures**
   ```bash
   # Check DNS propagation
   dig _acme-challenge.example.com TXT

   # Verify DigitalOcean DNS token
   kubectl get secret -n cert-manager digitalocean-dns -o yaml
   ```

2. **Rate Limit Issues**
   ```yaml
   # Use Let's Encrypt staging for testing
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-staging
   spec:
     acme:
       server: https://acme-staging-v02.api.letsencrypt.org/directory
   ```

3. **Certificate Renewal**
   ```bash
   # Force certificate renewal
   kubectl delete certificate example-com -n apps
   # cert-manager will recreate it
   ```

### TLS Configuration Issues

**Symptoms:**
- SSL/TLS protocol errors
- Cipher suite mismatches
- Mixed content warnings

**Diagnosis:**
```bash
# Test TLS configuration
openssl s_client -connect example.com:443 -servername example.com

# Check supported ciphers
nmap --script ssl-enum-ciphers -p 443 example.com

# Verify certificate chain
openssl s_client -connect example.com:443 -showcerts
```

**Solutions:**

1. **Update TLS Configuration**
   ```yaml
   # Kong TLS configuration
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: kong-config
   data:
     KONG_SSL_PROTOCOLS: "TLSv1.2 TLSv1.3"
     KONG_SSL_CIPHERS: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"
   ```

## Network Policy Issues

### Traffic Blocked by Network Policies

**Symptoms:**
- Service connection timeouts
- Intermittent connectivity
- DNS resolution failures

**Diagnosis:**
```bash
# List all network policies
kubectl get networkpolicies -A

# Test connectivity
kubectl exec -it debug-pod -- nc -zv service.namespace 80

# Check pod labels
kubectl get pods -n apps --show-labels

# Verify network policy selectors
kubectl describe networkpolicy -n apps
```

**Solutions:**

1. **DNS Access**
   ```yaml
   # Allow DNS for all pods
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: allow-dns
   spec:
     podSelector: {}
     policyTypes:
     - Egress
     egress:
     - to:
       - namespaceSelector:
           matchLabels:
             name: kube-system
       ports:
       - protocol: UDP
         port: 53
   ```

2. **Debug Network Policies**
   ```bash
   # Create debug pod
   kubectl run debug --image=nicolaka/netshoot -it --rm
   
   # Test from debug pod
   nslookup kubernetes.default
   curl -v http://service.namespace:80
   ```

## Secret Management Problems

### SOPS Decryption Failures

**Symptoms:**
- "Error decrypting secret" in Flux logs
- Secrets not being created
- Age key issues

**Diagnosis:**
```bash
# Check Flux kustomize-controller logs
kubectl logs -n flux-system deployment/kustomize-controller | grep -i error

# Verify age key secret
kubectl get secret -n flux-system sops-age -o yaml

# Test manual decryption
sops -d encrypted-secret.yaml
```

**Solutions:**

1. **Age Key Issues**
   ```bash
   # Recreate age key secret
   age-keygen -o age.agekey
   kubectl create secret generic sops-age \
     --namespace=flux-system \
     --from-file=age.agekey=age.agekey \
     --dry-run=client -o yaml | kubectl apply -f -
   
   # Restart Flux controllers
   kubectl rollout restart -n flux-system deployment/kustomize-controller
   ```

2. **SOPS Configuration**
   ```yaml
   # Update .sops.yaml
   creation_rules:
     - path_regex: .*\.yaml$
       encrypted_regex: ^(data|stringData)$
       age: age1...
   ```

### External Secrets Operator Issues

**Symptoms:**
- SecretStore not ready
- Secrets not syncing
- Authentication failures

**Diagnosis:**
```bash
# Check SecretStore status
kubectl get secretstores -A

# View ESO logs
kubectl logs -n external-secrets deployment/external-secrets

# Check ExternalSecret status
kubectl describe externalsecret -n apps my-secret
```

**Solutions:**

1. **Provider Authentication**
   ```yaml
   # Verify provider configuration
   apiVersion: external-secrets.io/v1beta1
   kind: SecretStore
   metadata:
     name: digitalocean
   spec:
     provider:
       doppler:
         auth:
           secretRef:
             dopplerToken:
               name: doppler-token
               key: token
   ```

## Security Scanning Failures

### Container Image Scanning

**Symptoms:**
- Deployments blocked by admission controller
- Vulnerability scan failures
- Image pull errors

**Diagnosis:**
```bash
# Check admission controller logs
kubectl logs -n security deployment/image-scanner-webhook

# Manual image scan
trivy image myapp:latest

# Review scan policies
kubectl get policies.security.example.com -A
```

**Solutions:**

1. **Whitelist Images**
   ```yaml
   # Temporary exception for critical updates
   apiVersion: security.example.com/v1
   kind: Policy
   metadata:
     name: allow-critical-images
   spec:
     exceptions:
     - image: "myapp:v1.2.3"
       reason: "Critical hotfix"
       until: "2024-12-31"
   ```

### Runtime Security Alerts

**Symptoms:**
- Falco alerts firing
- Suspicious process detection
- File integrity violations

**Diagnosis:**
```bash
# Check Falco logs
kubectl logs -n security daemonset/falco

# View Falco metrics
kubectl exec -n security daemonset/falco -- \
  curl -s http://localhost:8765/metrics | grep falco_events
```

**Solutions:**

1. **Tune Falco Rules**
   ```yaml
   # Custom Falco rules
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: falco-rules-custom
   data:
     rules-custom.yaml: |
       - rule: Allow package management
         desc: Allow apt/yum in containers during updates
         condition: >
           spawned_process and
           container and
           proc.name in (apt, apt-get, yum, dnf) and
           container.image.repository = "myapp"
         output: >
           Package manager run in container (user=%user.name command=%proc.cmdline)
         priority: INFO
         enabled: false
   ```

## Performance Impact

### Security Overhead

**Symptoms:**
- Increased latency
- High CPU usage
- Memory pressure

**Diagnosis:**
```bash
# Monitor security component resources
kubectl top pods -n security
kubectl top pods -n cert-manager
kubectl top pods -n keycloak

# Check latency metrics
kubectl exec -n monitoring prometheus-0 -- \
  promtool query instant 'http_request_duration_seconds'
```

**Solutions:**

1. **Optimize Security Policies**
   ```yaml
   # Reduce policy evaluation overhead
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: opa-config
   data:
     config.yaml: |
       decision_logs:
         console: false
       bundles:
         authz:
           resource: "/bundles/authz.tar.gz"
           persist: true
           polling:
             min_delay_seconds: 60
             max_delay_seconds: 120
   ```

2. **Resource Limits**
   ```yaml
   # Set appropriate resource limits
   resources:
     requests:
       memory: "128Mi"
       cpu: "100m"
     limits:
       memory: "256Mi"
       cpu: "200m"
   ```

## Common Security Misconfigurations

### Checklist for Security Review

1. **Default Credentials**
   ```bash
   # Search for default passwords
   grep -r "password\|secret" manifests/ | grep -v ".sops.yaml"
   ```

2. **Exposed Services**
   ```bash
   # Check for LoadBalancer services
   kubectl get svc -A -o wide | grep LoadBalancer
   
   # Verify ingress rules
   kubectl get ingress -A
   ```

3. **Privileged Containers**
   ```bash
   # Find privileged pods
   kubectl get pods -A -o json | jq '.items[] | select(.spec.containers[].securityContext.privileged==true) | .metadata.name'
   ```

4. **Insecure Configurations**
   ```bash
   # Check for hostNetwork pods
   kubectl get pods -A -o json | jq '.items[] | select(.spec.hostNetwork==true) | .metadata.name'
   
   # Find pods with ALL capabilities
   kubectl get pods -A -o json | jq '.items[] | select(.spec.containers[].securityContext.capabilities.add[]? == "ALL") | .metadata.name'
   ```

## Debugging Tools and Commands

### Security Audit Script

```bash
#!/usr/bin/env bash
# security-audit.sh - Quick security audit

echo "=== Security Audit Report ==="
echo "Date: $(date)"
echo

echo "1. Checking expired certificates..."
kubectl get certificates -A | grep -v True

echo "2. Checking failed authentication attempts..."
kubectl logs -n keycloak deployment/keycloak | grep -i "failed login" | tail -20

echo "3. Checking network policy coverage..."
TOTAL_PODS=$(kubectl get pods -A | wc -l)
COVERED_PODS=$(kubectl get networkpolicies -A -o json | jq '[.items[].spec.podSelector] | length')
echo "Network Policy Coverage: $COVERED_PODS/$TOTAL_PODS pods"

echo "4. Checking RBAC anomalies..."
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects[]'

echo "5. Checking secret encryption..."
kubectl get secrets -A -o json | jq '.items[] | select(.data | has("password")) | .metadata.name' | head -10
```

### Emergency Response Commands

```bash
# Isolate compromised pod
kubectl label pod suspicious-pod quarantine=true
kubectl patch networkpolicy default-deny -p '{"spec":{"podSelector":{"matchLabels":{"quarantine":"true"}}}}'

# Revoke user access
kubectl delete rolebinding user-binding -n production

# Force pod restart with new security context
kubectl patch deployment myapp -p '{"spec":{"template":{"metadata":{"annotations":{"security-update":"'$(date +%s)'"}}}}}'

# Emergency certificate rotation
kubectl delete secret tls-cert -n apps
kubectl annotate certificate example-com cert-manager.io/issue-temporary-certificate="true"
```

## Additional Resources

- [Kubernetes Security Documentation](https://kubernetes.io/docs/concepts/security/)
- [Kong Gateway Troubleshooting](https://docs.konghq.com/gateway/latest/troubleshooting/)
- [cert-manager Troubleshooting](https://cert-manager.io/docs/troubleshooting/)
- [Falco Troubleshooting](https://falco.org/docs/troubleshooting/)
- [Network Policy Editor](https://editor.cilium.io/) - Visual network policy creation