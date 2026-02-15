# Compliance Guide

This guide provides information on achieving and maintaining compliance with various regulatory standards when using this GitOps template.

## Table of Contents

- [Overview](#overview)
- [SOC 2 Compliance](#soc-2-compliance)
- [GDPR Compliance](#gdpr-compliance)
- [HIPAA Considerations](#hipaa-considerations)
- [PCI DSS Guidelines](#pci-dss-guidelines)
- [Industry-Specific Requirements](#industry-specific-requirements)
- [Compliance Automation](#compliance-automation)
- [Audit Preparation](#audit-preparation)

## Overview

This template provides a foundation for building compliant infrastructure, but achieving full compliance requires additional configuration and operational procedures specific to your organization and regulatory requirements.

### Shared Responsibility Model

When deploying on DigitalOcean:
- **DigitalOcean Responsibility**: Physical security, infrastructure compliance, platform security
- **Your Responsibility**: Application security, data protection, access management, configuration

## SOC 2 Compliance

### Trust Service Criteria

#### 1. Security (Common Criteria)

**Access Controls**
```yaml
# Implement role-based access control
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: soc2-user-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]
  # Principle of least privilege
```

**Encryption Requirements**
- Data at rest: Enable encryption for all persistent volumes
- Data in transit: TLS 1.2+ for all communications
- Key management: Use SOPS with age encryption

**Monitoring and Logging**
```yaml
# Audit logging configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: audit-config
data:
  audit-policy.yaml: |
    apiVersion: audit.k8s.io/v1
    kind: Policy
    rules:
    - level: RequestResponse
      users: ["*"]
      verbs: ["create", "update", "patch", "delete"]
      resources:
      - group: "*"
        resources: ["*"]
```

#### 2. Availability

**High Availability Configuration**
```yaml
# Multi-replica deployments
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

**Backup Procedures**
- Automated daily backups
- Geo-redundant storage
- Regular restore testing
- Documented RTO/RPO targets

#### 3. Processing Integrity

**Data Validation**
```yaml
# Input validation example
apiVersion: v1
kind: ConfigMap
metadata:
  name: validation-rules
data:
  rules.yaml: |
    email:
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    phone:
      pattern: '^\+?[1-9]\d{1,14}$'
```

#### 4. Confidentiality

**Secret Management**
- All secrets encrypted with SOPS
- Regular key rotation
- Access logging for sensitive data
- Data classification policies

#### 5. Privacy

**Data Handling**
```yaml
# PII data retention policy
apiVersion: batch/v1
kind: CronJob
metadata:
  name: data-retention
spec:
  schedule: "0 0 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            command: ["/scripts/cleanup-old-data.sh"]
            env:
            - name: RETENTION_DAYS
              value: "90"
```

### SOC 2 Controls Checklist

- [ ] User access reviews (quarterly)
- [ ] Password policy enforcement
- [ ] Multi-factor authentication
- [ ] Security awareness training
- [ ] Vulnerability management program
- [ ] Incident response procedures
- [ ] Change management process
- [ ] Business continuity planning

## GDPR Compliance

### Technical Measures

#### 1. Privacy by Design

**Data Minimization**
```yaml
# Collect only necessary data
apiVersion: v1
kind: ConfigMap
metadata:
  name: data-collection-policy
data:
  required-fields.json: |
    {
      "user": {
        "required": ["email"],
        "optional": ["name"],
        "prohibited": ["ssn", "race", "religion"]
      }
    }
```

#### 2. Right to Access

**Data Export API**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: gdpr-data-export
spec:
  ports:
  - port: 8080
    name: export-api
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gdpr-export-service
spec:
  template:
    spec:
      containers:
      - name: exporter
        image: gdpr-exporter:latest
        env:
        - name: EXPORT_FORMAT
          value: "JSON"
        - name: INCLUDE_METADATA
          value: "true"
```

#### 3. Right to Erasure

**Data Deletion Procedures**
```bash
#!/usr/bin/env bash
# GDPR data deletion script

USER_ID=$1
CONFIRMATION=$2

if [ "$CONFIRMATION" != "CONFIRM_DELETE" ]; then
  echo "Safety check failed. Use: $0 <user_id> CONFIRM_DELETE"
  exit 1
fi

# Delete from all data stores
kubectl exec -it postgres-0 -- psql -c "DELETE FROM users WHERE id = '$USER_ID'"
kubectl exec -it redis-0 -- redis-cli DEL "user:$USER_ID:*"

# Log deletion for compliance
echo "$(date): Deleted data for user $USER_ID" >> /var/log/gdpr-deletions.log
```

#### 4. Data Portability

**Export Formats**
- JSON format for technical users
- CSV format for end users
- XML format for system integration

#### 5. Consent Management

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: consent-tracking
data:
  consent-schema.json: |
    {
      "userId": "string",
      "consents": {
        "marketing": {
          "granted": "boolean",
          "timestamp": "datetime",
          "version": "string"
        },
        "analytics": {
          "granted": "boolean",
          "timestamp": "datetime",
          "version": "string"
        }
      }
    }
```

### GDPR Compliance Checklist

- [ ] Privacy policy updated and accessible
- [ ] Cookie consent implementation
- [ ] Data processing agreements with vendors
- [ ] Data breach notification procedures (72 hours)
- [ ] Privacy Impact Assessments (PIA)
- [ ] Data Protection Officer (DPO) designation
- [ ] Cross-border data transfer mechanisms

## HIPAA Considerations

> **Note**: This template is not HIPAA-certified out of the box. Additional measures are required for healthcare data.

### Technical Safeguards

#### 1. Access Control

```yaml
# HIPAA-compliant access control
apiVersion: v1
kind: NetworkPolicy
metadata:
  name: hipaa-network-policy
spec:
  podSelector:
    matchLabels:
      hipaa: "true"
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          hipaa-authorized: "true"
```

#### 2. Audit Controls

```yaml
# Enhanced audit logging for HIPAA
apiVersion: v1
kind: ConfigMap
metadata:
  name: hipaa-audit-policy
data:
  policy.yaml: |
    rules:
    - level: RequestResponse
      omitStages: []
      resources:
      - group: ""
        resources: ["*"]
      namespaces: ["hipaa-data"]
```

#### 3. Encryption Standards

- AES-256 encryption at rest
- TLS 1.2+ for data in transit
- Key management with hardware security modules (HSM)

### HIPAA Compliance Requirements

- [ ] Business Associate Agreements (BAA)
- [ ] Risk assessments
- [ ] Workforce training
- [ ] Physical security controls
- [ ] Contingency planning
- [ ] Regular security audits

## PCI DSS Guidelines

### Network Segmentation

```yaml
# PCI DSS network segmentation
apiVersion: v1
kind: Namespace
metadata:
  name: pci-cardholder-data
  labels:
    pci-dss: "true"
    security-zone: "cde"  # Cardholder Data Environment
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: pci-isolation
  namespace: pci-cardholder-data
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          pci-dss: "true"
```

### Security Controls

#### 1. Firewall Configuration

```yaml
# Kong Gateway PCI DSS plugins
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: pci-rate-limiting
config:
  minute: 100
  policy: local
---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: pci-ip-restriction
config:
  allow:
  - "10.0.0.0/8"  # Internal only
```

#### 2. Data Retention

```bash
# PCI DSS compliant log rotation
cat > /etc/logrotate.d/pci-logs << EOF
/var/log/pci/*.log {
    daily
    rotate 90
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root adm
    sharedscripts
    postrotate
        /usr/bin/systemctl reload rsyslog > /dev/null
    endscript
}
EOF
```

### PCI DSS Requirements

- [ ] Quarterly vulnerability scans
- [ ] Annual penetration testing
- [ ] Security awareness training
- [ ] Incident response plan
- [ ] Change control procedures
- [ ] Physical security measures

## Industry-Specific Requirements

### Financial Services (FINRA/SEC)

```yaml
# Financial data retention (7 years)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: financial-archive
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Ti
  storageClassName: do-block-storage-retain
```

### Healthcare (Beyond HIPAA)

- FDA 21 CFR Part 11 for electronic records
- State-specific privacy laws
- Clinical trial data requirements

### Education (FERPA)

```yaml
# FERPA data access controls
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ferpa-educator
rules:
- apiGroups: [""]
  resources: ["student-records"]
  verbs: ["get", "list"]
  resourceNames: ["assigned-students"]
```

## Compliance Automation

### Continuous Compliance Monitoring

```yaml
# Deploy compliance scanning
apiVersion: batch/v1
kind: CronJob
metadata:
  name: compliance-scanner
spec:
  schedule: "0 0 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scanner
            image: compliance-scanner:latest
            command:
            - /scan.sh
            - --frameworks
            - "soc2,gdpr,pci-dss"
            - --output
            - "/reports/compliance-$(date +%Y%m%d).json"
```

### Policy as Code

```yaml
# Open Policy Agent (OPA) policies
apiVersion: v1
kind: ConfigMap
metadata:
  name: compliance-policies
data:
  soc2.rego: |
    package soc2
    
    deny[msg] {
      input.kind == "Deployment"
      input.spec.replicas < 2
      msg := "SOC2: Deployments must have at least 2 replicas"
    }
    
    deny[msg] {
      input.kind == "Pod"
      not input.spec.securityContext.runAsNonRoot
      msg := "SOC2: Pods must run as non-root"
    }
```

### Compliance Dashboards

```yaml
# Grafana dashboard for compliance metrics
apiVersion: v1
kind: ConfigMap
metadata:
  name: compliance-dashboard
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "Compliance Status",
        "panels": [
          {
            "title": "Policy Violations",
            "targets": [{
              "expr": "sum(opa_policy_violations) by (policy)"
            }]
          },
          {
            "title": "Encryption Coverage",
            "targets": [{
              "expr": "100 * sum(encrypted_volumes) / sum(total_volumes)"
            }]
          }
        ]
      }
    }
```

## Audit Preparation

### Documentation Requirements

1. **System Documentation**
   - Architecture diagrams
   - Data flow diagrams
   - Network topology
   - Security controls

2. **Process Documentation**
   - Change management procedures
   - Incident response plans
   - Backup and recovery procedures
   - Access control processes

3. **Evidence Collection**
   ```bash
   #!/usr/bin/env bash
   # Audit evidence collection script
   
   AUDIT_DIR="/audit/$(date +%Y%m%d)"
   mkdir -p $AUDIT_DIR
   
   # Collect configurations
   kubectl get all -A -o yaml > $AUDIT_DIR/k8s-resources.yaml
   
   # Export RBAC policies
   kubectl get roles,rolebindings,clusterroles,clusterrolebindings -A -o yaml > $AUDIT_DIR/rbac.yaml
   
   # Network policies
   kubectl get networkpolicies -A -o yaml > $AUDIT_DIR/network-policies.yaml
   
   # Generate reports
   compliance-scanner --full-report > $AUDIT_DIR/compliance-report.html
   ```

### Audit Trail Maintenance

```yaml
# Audit trail retention
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: audit-trails
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 500Gi
  storageClassName: do-block-storage-retain
```

### Common Audit Findings

1. **Access Control Issues**
   - Excessive permissions
   - Shared accounts
   - Missing MFA

2. **Monitoring Gaps**
   - Incomplete logging
   - Missing alerts
   - No log retention

3. **Documentation Deficiencies**
   - Outdated procedures
   - Missing evidence
   - Incomplete records

## Compliance Resources

### Standards and Frameworks
- [SOC 2 Trust Services Criteria](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome)
- [GDPR Official Text](https://gdpr-info.eu/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)

### Tools and Services
- [Open Policy Agent](https://www.openpolicyagent.org/) - Policy enforcement
- [Falco](https://falco.org/) - Runtime security and compliance
- [InSpec](https://www.inspec.io/) - Compliance automation
- [CloudSploit](https://cloudsploit.com/) - Cloud security scanning

### DigitalOcean Compliance
- [DigitalOcean Trust Platform](https://www.digitalocean.com/trust/)
- [DigitalOcean Security](https://www.digitalocean.com/security/)
- SOC 2 Type II certified
- GDPR compliant infrastructure