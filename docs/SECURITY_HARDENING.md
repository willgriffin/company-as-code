# Security Hardening Guide

This guide provides comprehensive security hardening recommendations for production deployments of the GitOps template on DigitalOcean Kubernetes.

## Table of Contents

- [Pre-Deployment Security Checklist](#pre-deployment-security-checklist)
- [Infrastructure Security](#infrastructure-security)
- [Network Security](#network-security)
- [Application Security](#application-security)
- [Secrets Management](#secrets-management)
- [Monitoring and Incident Response](#monitoring-and-incident-response)
- [Security Validation](#security-validation)

## Pre-Deployment Security Checklist

Before deploying to production, ensure the following security measures are in place:

### Infrastructure Preparation
- [ ] Enable DigitalOcean Cloud Firewall on all nodes
- [ ] Configure VPC for network isolation
- [ ] Enable DigitalOcean monitoring and alerts
- [ ] Set up backup policies for persistent volumes
- [ ] Review and restrict DigitalOcean API token permissions

### Configuration Security
- [ ] Generate strong, unique passwords for all services
- [ ] Configure unique SOPS age keys per environment
- [ ] Review all default configurations in `config.yaml`
- [ ] Disable any unnecessary services or features
- [ ] Configure resource limits for all workloads

### Access Control
- [ ] Set up multi-factor authentication for DigitalOcean account
- [ ] Restrict kubectl access using RBAC
- [ ] Configure Keycloak with strong password policies
- [ ] Set up proper OAuth2 proxy configurations
- [ ] Review and restrict service account permissions

## Infrastructure Security

### Node Security Hardening

1. **Kubernetes Version Management**
   ```bash
   # Keep Kubernetes version up to date
   doctl kubernetes cluster list
   doctl kubernetes cluster upgrade <cluster-id> --version latest
   ```

2. **Node Pool Security**
   - Use dedicated node pools for different workload types
   - Enable auto-upgrade for minor versions
   - Configure node labels for workload isolation

3. **Control Plane Security**
   - Restrict API server access to known IP ranges
   - Enable audit logging
   - Configure webhook admission controllers

### DigitalOcean Firewall Configuration

Create restrictive firewall rules:

```yaml
# Example firewall configuration
inbound_rules:
  # Allow HTTPS traffic
  - protocol: tcp
    ports: "443"
    sources:
      addresses: ["0.0.0.0/0", "::/0"]
  
  # Allow HTTP traffic (redirect to HTTPS)
  - protocol: tcp
    ports: "80"
    sources:
      addresses: ["0.0.0.0/0", "::/0"]
  
  # Restrict SSH access
  - protocol: tcp
    ports: "22"
    sources:
      addresses: ["YOUR_ADMIN_IP/32"]

outbound_rules:
  # Allow all outbound traffic (adjust as needed)
  - protocol: tcp
    ports: "1-65535"
    destinations:
      addresses: ["0.0.0.0/0", "::/0"]
```

## Network Security

### Network Policies

1. **Default Deny Policy**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: default-deny-all
     namespace: default
   spec:
     podSelector: {}
     policyTypes:
     - Ingress
     - Egress
   ```

2. **Application-Specific Policies**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: allow-app-traffic
     namespace: apps
   spec:
     podSelector:
       matchLabels:
         app: myapp
     policyTypes:
     - Ingress
     - Egress
     ingress:
     - from:
       - namespaceSelector:
           matchLabels:
             name: kong-gateway
       ports:
       - protocol: TCP
         port: 8080
     egress:
     - to:
       - namespaceSelector:
           matchLabels:
             name: databases
       ports:
       - protocol: TCP
         port: 5432
   ```

### Kong Gateway Security

1. **Rate Limiting**
   ```yaml
   apiVersion: configuration.konghq.com/v1
   kind: KongPlugin
   metadata:
     name: rate-limit
   config:
     minute: 100
     policy: local
   ```

2. **IP Restriction**
   ```yaml
   apiVersion: configuration.konghq.com/v1
   kind: KongPlugin
   metadata:
     name: ip-restriction
   config:
     allow:
     - 192.168.1.0/24
     deny:
     - 10.0.0.0/8
   ```

3. **Authentication Plugins**
   - Enable OAuth2 authentication
   - Configure JWT validation
   - Set up API key authentication where appropriate

## Application Security

### Pod Security Standards

1. **Enforce Restricted Security Standards**
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: production
     labels:
       pod-security.kubernetes.io/enforce: restricted
       pod-security.kubernetes.io/audit: restricted
       pod-security.kubernetes.io/warn: restricted
   ```

2. **Security Context Configuration**
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

### RBAC Configuration

1. **Principle of Least Privilege**
   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   metadata:
     name: app-reader
   rules:
   - apiGroups: [""]
     resources: ["pods", "services"]
     verbs: ["get", "list", "watch"]
   ```

2. **Service Account Security**
   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: app-service-account
   automountServiceAccountToken: false
   ```

### Container Image Security

1. **Image Scanning**
   - Use only verified base images
   - Scan images for vulnerabilities before deployment
   - Configure image pull policies to `Always`

2. **Registry Security**
   - Use private registries for proprietary code
   - Enable registry scanning
   - Configure image signing

## Secrets Management

### SOPS Configuration

1. **Age Key Management**
   ```bash
   # Generate environment-specific age keys
   age-keygen -o production.agekey
   age-keygen -o staging.agekey
   
   # Configure .sops.yaml
   creation_rules:
     - path_regex: .*production.*\.yaml$
       age: age1production...
     - path_regex: .*staging.*\.yaml$
       age: age1staging...
   ```

2. **Secret Rotation**
   - Implement regular key rotation schedules
   - Document rotation procedures
   - Test restore procedures

### External Secrets Operator

1. **Backend Configuration**
   ```yaml
   apiVersion: external-secrets.io/v1beta1
   kind: SecretStore
   metadata:
     name: vault-backend
   spec:
     provider:
       vault:
         server: "https://vault.example.com"
         path: "secret"
         version: "v2"
         auth:
           kubernetes:
             mountPath: "kubernetes"
             role: "external-secrets"
   ```

2. **Secret Policies**
   - Define clear secret naming conventions
   - Implement access policies
   - Enable audit logging for secret access

## Monitoring and Incident Response

### Security Monitoring

1. **Falco Integration**
   ```yaml
   # Deploy Falco for runtime security monitoring
   helm repo add falcosecurity https://falcosecurity.github.io/charts
   helm install falco falcosecurity/falco \
     --set falco.grpc.enabled=true \
     --set falco.grpcOutput.enabled=true
   ```

2. **Audit Log Collection**
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: audit-policy
   data:
     audit-policy.yaml: |
       apiVersion: audit.k8s.io/v1
       kind: Policy
       rules:
         - level: RequestResponse
           omitStages:
           - RequestReceived
           resources:
           - group: ""
             resources: ["secrets", "configmaps"]
           namespaces: ["production", "staging"]
   ```

### Alerting Configuration

1. **Security Alerts**
   - Unauthorized access attempts
   - Privilege escalation
   - Suspicious container behavior
   - Failed authentication attempts

2. **Alert Channels**
   - Configure Mattermost webhooks for security alerts
   - Set up email notifications for critical events
   - Integrate with incident response systems

### Incident Response Procedures

1. **Initial Response**
   ```bash
   # Isolate affected resources
   kubectl cordon <node-name>
   kubectl drain <node-name> --ignore-daemonsets
   
   # Capture evidence
   kubectl logs <pod-name> > incident-logs.txt
   kubectl describe pod <pod-name> > pod-description.txt
   ```

2. **Investigation Steps**
   - Review audit logs
   - Check for unauthorized changes
   - Analyze network traffic
   - Document findings

3. **Recovery Process**
   - Patch vulnerabilities
   - Update security policies
   - Restore from clean backups
   - Conduct post-mortem analysis

## Security Validation

### Automated Security Scanning

1. **Kubernetes Security Scanning**
   ```bash
   # Install kubesec
   kubectl apply -f https://raw.githubusercontent.com/controlplaneio/kubesec/master/deployment.yaml
   
   # Scan deployments
   kubectl get deploy -o yaml | kubesec scan -
   ```

2. **CIS Benchmark Validation**
   ```bash
   # Run kube-bench
   kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
   kubectl logs -f job/kube-bench
   ```

### Penetration Testing

1. **Network Testing**
   - Port scanning
   - Service enumeration
   - SSL/TLS configuration testing

2. **Application Testing**
   - Authentication bypass attempts
   - Authorization testing
   - Input validation testing

### Compliance Validation

1. **Regular Audits**
   - Monthly security reviews
   - Quarterly penetration tests
   - Annual compliance assessments

2. **Documentation**
   - Maintain security documentation
   - Update incident response procedures
   - Track security metrics

## Security Maintenance

### Regular Updates

1. **Component Updates**
   ```bash
   # Update Flux components
   flux update
   
   # Update Helm releases
   helm repo update
   helm upgrade <release> <chart> --version <new-version>
   ```

2. **Security Patches**
   - Subscribe to security advisories
   - Test patches in staging first
   - Document patch procedures

### Security Reviews

1. **Code Reviews**
   - Review all infrastructure changes
   - Check for security implications
   - Validate RBAC changes

2. **Configuration Reviews**
   - Audit secret usage
   - Review network policies
   - Check resource limits

## Additional Resources

- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [NIST Container Security Guide](https://csrc.nist.gov/publications/detail/sp/800-190/final)
- [DigitalOcean Security Best Practices](https://docs.digitalocean.com/products/droplets/resources/best-practices/security/)
- [Kong Security Documentation](https://docs.konghq.com/gateway/latest/production/security/)