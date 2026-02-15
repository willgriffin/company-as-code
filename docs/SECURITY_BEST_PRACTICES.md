# Security Best Practices

This guide outlines security best practices for operating and maintaining your GitOps-managed Kubernetes infrastructure.

## Table of Contents

- [Password and Authentication Policies](#password-and-authentication-policies)
- [Multi-Factor Authentication](#multi-factor-authentication)
- [Security Updates and Patching](#security-updates-and-patching)
- [Backup Security](#backup-security)
- [Development Security](#development-security)
- [Operational Security](#operational-security)
- [Security Culture](#security-culture)

## Password and Authentication Policies

### Password Requirements

1. **Minimum Standards**
   - Length: Minimum 16 characters for administrative accounts
   - Complexity: Mix of uppercase, lowercase, numbers, and special characters
   - Uniqueness: No password reuse across services
   - Rotation: Quarterly for privileged accounts

2. **Password Generation**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   
   # Or use pwgen
   pwgen -s -y 32 1
   ```

3. **Keycloak Password Policy Configuration**
   ```yaml
   passwordPolicy:
     - length(16)
     - upperCase(2)
     - lowerCase(2)
     - digits(2)
     - specialChars(2)
     - notUsername
     - passwordHistory(5)
   ```

### Service Account Management

1. **API Token Security**
   - Use separate tokens for different services
   - Implement token rotation schedules
   - Store tokens securely using SOPS
   - Monitor token usage

2. **SSH Key Management**
   ```bash
   # Generate strong SSH keys
   ssh-keygen -t ed25519 -C "service-account@example.com"
   
   # Set proper permissions
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ```

## Multi-Factor Authentication

### Keycloak MFA Configuration

1. **TOTP Setup**
   ```yaml
   authentication:
     requiredActions:
       - CONFIGURE_TOTP
     otpPolicy:
       type: totp
       algorithm: HmacSHA256
       digits: 6
       period: 30
       lookAheadWindow: 1
   ```

2. **WebAuthn Configuration**
   ```yaml
   authentication:
     requiredActions:
       - WEBAUTHN_REGISTER
     webAuthnPolicy:
       rpName: "Your Organization"
       signatureAlgorithms:
         - ES256
         - RS256
       attestationConveyancePreference: direct
       authenticatorAttachment: cross-platform
       requireResidentKey: false
       userVerificationRequirement: preferred
   ```

### Administrative Access

1. **DigitalOcean Account**
   - Enable MFA for all team members
   - Use hardware security keys when possible
   - Regular audit of access logs

2. **Kubernetes Access**
   ```yaml
   # Configure OIDC authentication
   apiVersion: v1
   kind: Config
   clusters:
   - cluster:
       server: https://your-cluster.k8s.local
       certificate-authority-data: <ca-data>
   users:
   - name: oidc-user
     user:
       exec:
         apiVersion: client.authentication.k8s.io/v1beta1
         command: kubectl-oidc-login
         args:
         - get-token
         - --oidc-issuer-url=https://keycloak.example.com/realms/master
         - --oidc-client-id=kubernetes
   ```

## Security Updates and Patching

### Update Strategy

1. **Automated Dependency Updates**
   ```yaml
   # Renovate configuration
   {
     "extends": ["config:base"],
     "kubernetes": {
       "fileMatch": ["manifests/.+\\.yaml$"]
     },
     "helm-values": {
       "fileMatch": ["manifests/.+\\.yaml$"]
     },
     "regexManagers": [{
       "fileMatch": ["manifests/.+\\.yaml$"],
       "matchStrings": [
         "repository: (?<depName>.*?)\\s*tag: (?<currentValue>.*?)\\s"
       ],
       "datasourceTemplate": "docker"
     }]
   }
   ```

2. **Patch Management Process**
   - Review security advisories weekly
   - Test patches in staging environment
   - Schedule maintenance windows
   - Document patch procedures

### Component Update Procedures

1. **Flux Updates**
   ```bash
   # Check for updates
   flux check --pre
   
   # Update Flux components
   flux update
   
   # Verify update
   flux check
   ```

2. **Application Updates**
   ```bash
   # Update Helm repositories
   helm repo update
   
   # Check for available updates
   helm list -A | while read -r release namespace chart; do
     helm show chart $chart | grep version
   done
   ```

## Backup Security

### Backup Encryption

1. **Database Backups**
   ```yaml
   apiVersion: batch/v1
   kind: CronJob
   metadata:
     name: postgres-backup
   spec:
     schedule: "0 2 * * *"
     jobTemplate:
       spec:
         template:
           spec:
             containers:
             - name: backup
               image: postgres:15
               command:
               - /bin/bash
               - -c
               - |
                 pg_dump $DATABASE_URL | \
                 gzip | \
                 age -r $AGE_PUBLIC_KEY | \
                 s3cmd put - s3://backups/postgres/$(date +%Y%m%d-%H%M%S).sql.gz.age
   ```

2. **File Backups**
   ```bash
   # Encrypt backups before storage
   tar -czf - /data | \
     age -r age1publickey... | \
     s3cmd put - s3://backups/files/backup-$(date +%Y%m%d).tar.gz.age
   ```

### Backup Access Control

1. **S3 Bucket Policies**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": {
         "AWS": "arn:aws:iam::123456789012:role/backup-role"
       },
       "Action": ["s3:PutObject"],
       "Resource": "arn:aws:s3:::backups/*",
       "Condition": {
         "StringEquals": {
           "s3:x-amz-server-side-encryption": "AES256"
         }
       }
     }]
   }
   ```

2. **Backup Retention**
   - Daily backups: 7 days
   - Weekly backups: 4 weeks
   - Monthly backups: 12 months
   - Annual backups: 7 years (compliance)

### Backup Testing

1. **Regular Restore Tests**
   ```bash
   # Monthly restore test procedure
   #!/usr/bin/env bash
   set -euo pipefail
   
   # Download latest backup
   s3cmd get s3://backups/postgres/latest.sql.gz.age
   
   # Decrypt backup
   age -d -i backup.agekey latest.sql.gz.age | gunzip > restore.sql
   
   # Test restore to temporary database
   createdb test_restore
   psql test_restore < restore.sql
   
   # Verify data integrity
   psql test_restore -c "SELECT COUNT(*) FROM critical_table;"
   
   # Cleanup
   dropdb test_restore
   rm restore.sql latest.sql.gz.age
   ```

## Development Security

### Secure Development Practices

1. **Code Review Requirements**
   - All changes require peer review
   - Security-focused review checklist
   - Automated security scanning
   - Sign commits with GPG

2. **Git Security**
   ```bash
   # Configure signed commits
   git config --global user.signingkey YOUR_GPG_KEY
   git config --global commit.gpgsign true
   
   # Pre-commit hooks for security
   cat > .git/hooks/pre-commit << 'EOF'
   #!/bin/bash
   # Check for secrets
   if git diff --cached --name-only | xargs grep -E "(password|secret|key)\\s*="; then
     echo "Potential secret detected!"
     exit 1
   fi
   EOF
   chmod +x .git/hooks/pre-commit
   ```

### CI/CD Security

1. **GitHub Actions Security**
   ```yaml
   name: Secure CI Pipeline
   on:
     pull_request:
       branches: [main]
   
   permissions:
     contents: read
     pull-requests: read
   
   jobs:
     security-scan:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4
       
       - name: Run Trivy vulnerability scanner
         uses: aquasecurity/trivy-action@master
         with:
           scan-type: 'fs'
           scan-ref: '.'
           format: 'sarif'
           output: 'trivy-results.sarif'
       
       - name: Upload Trivy scan results
         uses: github/codeql-action/upload-sarif@v2
         with:
           sarif_file: 'trivy-results.sarif'
   ```

2. **Secret Management in CI/CD**
   - Use GitHub encrypted secrets
   - Rotate CI/CD credentials regularly
   - Audit secret access logs
   - Implement least privilege access

## Operational Security

### Logging and Monitoring

1. **Centralized Logging**
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: fluent-bit-config
   data:
     fluent-bit.conf: |
       [SERVICE]
           Flush         5
           Log_Level     info
           Daemon        off
       
       [INPUT]
           Name              tail
           Path              /var/log/containers/*.log
           Parser            docker
           Tag               kube.*
           Refresh_Interval  5
       
       [FILTER]
           Name    record_modifier
           Match   *
           Record  cluster ${CLUSTER_NAME}
           Record  environment ${ENVIRONMENT}
       
       [OUTPUT]
           Name  s3
           Match *
           bucket logs-${ENVIRONMENT}
           region us-east-1
           use_put_object On
           compression gzip
   ```

2. **Security Event Monitoring**
   - Failed authentication attempts
   - Privilege escalation events
   - Resource creation/deletion
   - Configuration changes

### Access Management

1. **Just-In-Time Access**
   ```bash
   # Temporary elevated access script
   #!/usr/bin/env bash
   DURATION=${1:-3600}  # Default 1 hour
   
   # Grant temporary admin access
   kubectl create rolebinding temp-admin \
     --clusterrole=admin \
     --user=$USER \
     --namespace=production
   
   # Schedule removal
   at now + $DURATION seconds << EOF
   kubectl delete rolebinding temp-admin -n production
   EOF
   ```

2. **Access Reviews**
   - Monthly review of user access
   - Quarterly service account audit
   - Annual privilege review
   - Document access changes

### Incident Response

1. **Security Incident Checklist**
   - [ ] Isolate affected systems
   - [ ] Preserve evidence
   - [ ] Notify security team
   - [ ] Begin investigation
   - [ ] Document timeline
   - [ ] Implement fixes
   - [ ] Conduct post-mortem

2. **Communication Plan**
   - Internal notification procedures
   - Customer communication templates
   - Regulatory reporting requirements
   - Public disclosure guidelines

## Security Culture

### Training and Awareness

1. **Security Training Program**
   - Onboarding security training
   - Annual security awareness
   - Role-specific training
   - Incident simulation exercises

2. **Security Champions**
   - Designate team security champions
   - Regular security meetings
   - Share security updates
   - Recognize security contributions

### Security Metrics

1. **Key Security Indicators**
   - Time to patch critical vulnerabilities
   - Number of security incidents
   - Mean time to detection (MTTD)
   - Mean time to response (MTTR)

2. **Security Dashboard**
   ```yaml
   # Grafana dashboard for security metrics
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: security-dashboard
   data:
     dashboard.json: |
       {
         "dashboard": {
           "title": "Security Metrics",
           "panels": [
             {
               "title": "Failed Login Attempts",
               "targets": [{
                 "expr": "sum(rate(keycloak_login_failures[5m]))"
               }]
             },
             {
               "title": "Unauthorized API Calls",
               "targets": [{
                 "expr": "sum(rate(apiserver_unauthorized_requests[5m]))"
               }]
             }
           ]
         }
       }
   ```

### Continuous Improvement

1. **Security Reviews**
   - Monthly security metrics review
   - Quarterly threat assessment
   - Annual security strategy update
   - Regular tooling evaluation

2. **Feedback Loops**
   - Post-incident reviews
   - Security suggestion box
   - Bug bounty program consideration
   - Community engagement

## Security Resources

### Documentation
- [OWASP Kubernetes Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Kubernetes_Security_Cheat_Sheet.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Cloud Security Alliance Guidelines](https://cloudsecurityalliance.org/)

### Tools
- [Falco](https://falco.org/) - Runtime security monitoring
- [Trivy](https://aquasecurity.github.io/trivy/) - Vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Web application security testing
- [Kubescape](https://github.com/kubescape/kubescape) - Kubernetes security scanning

### Communities
- [Kubernetes Security Special Interest Group](https://github.com/kubernetes/sig-security)
- [Cloud Native Security Working Group](https://github.com/cncf/tag-security)
- [DigitalOcean Community Security Forum](https://www.digitalocean.com/community/tags/security)