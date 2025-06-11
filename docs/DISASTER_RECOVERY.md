# Disaster Recovery Procedures

This document outlines step-by-step procedures for recovering from various disaster scenarios in the Kubernetes cluster deployment.

## Table of Contents

1. [Overview](#overview)
2. [Backup Systems](#backup-systems)
3. [Recovery Scenarios](#recovery-scenarios)
4. [Step-by-Step Recovery Procedures](#step-by-step-recovery-procedures)
5. [Verification and Testing](#verification-and-testing)
6. [Emergency Contacts](#emergency-contacts)

## Overview

The cluster implements a comprehensive backup and disaster recovery strategy with multiple layers of protection:

- **PostgreSQL Database Backups**: Automated via CloudNativePG to DigitalOcean Spaces
- **Application-Level Backups**: Automated via Velero for Kubernetes resources and persistent volumes
- **Infrastructure State**: Terraform state in DigitalOcean Spaces with versioning
- **GitOps Configuration**: Git repository with encrypted secrets using SOPS/Age

## Backup Systems

### PostgreSQL Backups (CloudNativePG)

**Services**: Keycloak, Mattermost, Nextcloud, Mailu

**Configuration**:
- **Destination**: `s3://{cluster-name}-backup/{service}-postgres/`
- **Retention**: 30 days for data, 7 days for WAL
- **Schedule**: Continuous WAL archiving + periodic base backups
- **Storage**: DigitalOcean Spaces (S3-compatible)

**Backup Contents**:
- Database dump files
- Write-Ahead Log (WAL) files for point-in-time recovery
- Configuration and metadata

### Application Backups (Velero)

**Schedule**:
- **Daily**: Application namespaces (2 AM UTC, 30-day retention)
- **Weekly**: Full cluster backup (Sunday 1 AM UTC, 12-week retention)

**Backup Contents**:
- Kubernetes resources (Deployments, Services, ConfigMaps, Secrets)
- Persistent Volume data (via Restic)
- Custom Resource Definitions
- RBAC configurations

### Infrastructure Backups

**Terraform State**:
- **Location**: DigitalOcean Spaces bucket with versioning
- **Retention**: Automatic versioning with lifecycle policies
- **Contents**: Infrastructure state, resource relationships

**GitOps Configuration**:
- **Location**: Git repository (GitHub)
- **Protection**: Branch protection, encrypted secrets
- **Contents**: Flux configurations, application manifests, secrets

## Recovery Scenarios

### Scenario 1: Single Database Corruption
**Impact**: One application database is corrupted or lost
**RTO**: 30 minutes
**RPO**: Up to 1 hour

### Scenario 2: Complete Cluster Loss
**Impact**: Entire Kubernetes cluster is lost
**RTO**: 2-4 hours  
**RPO**: Up to 24 hours

### Scenario 3: Application Data Loss
**Impact**: Persistent volumes or application configurations lost
**RTO**: 1-2 hours
**RPO**: Up to 24 hours

### Scenario 4: Complete Infrastructure Loss
**Impact**: Entire DigitalOcean infrastructure is lost
**RTO**: 4-8 hours
**RPO**: Up to 24 hours

## Step-by-Step Recovery Procedures

### PostgreSQL Database Recovery

#### Point-in-Time Recovery (PITR)

1. **Identify Recovery Point**:
   ```bash
   # List available backups
   kubectl get backup -n {namespace}
   
   # Check backup details
   kubectl describe backup {backup-name} -n {namespace}
   ```

2. **Create Recovery Cluster**:
   ```yaml
   apiVersion: postgresql.cnpg.io/v1
   kind: Cluster
   metadata:
     name: {service}-pg-recovery
     namespace: {namespace}
   spec:
     instances: 1
     bootstrap:
       recovery:
         source: {original-cluster-name}
         recoveryTargetTime: "2024-01-01 12:00:00"
   ```

3. **Apply Recovery Configuration**:
   ```bash
   kubectl apply -f recovery-cluster.yaml
   ```

4. **Verify Recovery**:
   ```bash
   # Check cluster status
   kubectl get cluster {service}-pg-recovery -n {namespace}
   
   # Connect and verify data
   kubectl exec -it {pod-name} -n {namespace} -- psql -U {username} -d {database}
   ```

5. **Switch Applications**:
   - Update application configurations to point to recovery cluster
   - Test application functionality
   - Remove original cluster when confirmed working

#### Full Database Restore

1. **Stop Application**:
   ```bash
   kubectl scale deployment {app-deployment} --replicas=0 -n {namespace}
   ```

2. **Delete Existing Cluster**:
   ```bash
   kubectl delete cluster {cluster-name} -n {namespace}
   ```

3. **Restore from Backup**:
   ```yaml
   apiVersion: postgresql.cnpg.io/v1
   kind: Cluster
   metadata:
     name: {cluster-name}
     namespace: {namespace}
   spec:
     bootstrap:
       recovery:
         source: {cluster-name}
         # Uses latest available backup by default
   ```

4. **Restart Application**:
   ```bash
   kubectl scale deployment {app-deployment} --replicas=1 -n {namespace}
   ```

### Velero Application Recovery

#### Restore Single Application

1. **List Available Backups**:
   ```bash
   velero backup get
   ```

2. **Create Restore**:
   ```bash
   velero restore create {restore-name} \
     --from-backup {backup-name} \
     --include-namespaces {namespace}
   ```

3. **Monitor Restore Progress**:
   ```bash
   velero restore describe {restore-name}
   velero restore logs {restore-name}
   ```

#### Restore Multiple Applications

1. **Create Comprehensive Restore**:
   ```bash
   velero restore create full-cluster-restore \
     --from-backup {weekly-backup-name} \
     --include-namespaces keycloak,mattermost,nextcloud,mailu
   ```

2. **Verify Applications**:
   ```bash
   # Check all deployments
   kubectl get deployments --all-namespaces
   
   # Check persistent volumes
   kubectl get pv,pvc --all-namespaces
   ```

### Complete Cluster Recovery

#### Prerequisites
- Access to Terraform configuration
- DigitalOcean API credentials
- GitHub repository access
- Age private key for SOPS decryption

#### Step 1: Infrastructure Recovery

1. **Clone Repository**:
   ```bash
   git clone {repository-url}
   cd {repository-name}
   ```

2. **Setup Terraform**:
   ```bash
   cd terraform/digitalocean
   terraform init
   ```

3. **Review and Apply**:
   ```bash
   # Check what will be created
   terraform plan
   
   # Create infrastructure
   terraform apply
   ```

4. **Update Kubeconfig**:
   ```bash
   # Get cluster credentials
   doctl kubernetes cluster kubeconfig save {cluster-name}
   ```

#### Step 2: GitOps Recovery

1. **Bootstrap Flux**:
   ```bash
   # This should be handled by Terraform, but verify
   flux check --pre
   flux get kustomizations
   ```

2. **Verify Controllers**:
   ```bash
   kubectl get pods -n flux-system
   kubectl get pods -n cert-manager
   kubectl get pods -n traefik
   ```

#### Step 3: Application Recovery

1. **Wait for Velero Deployment**:
   ```bash
   kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=velero -n velero --timeout=300s
   ```

2. **List Available Backups**:
   ```bash
   velero backup get
   ```

3. **Restore Applications**:
   ```bash
   # Restore from most recent backup
   velero restore create disaster-recovery \
     --from-backup {latest-backup-name}
   ```

4. **Monitor Recovery**:
   ```bash
   velero restore describe disaster-recovery
   watch kubectl get pods --all-namespaces
   ```

## Verification and Testing

### Regular Backup Testing

**Monthly**: Perform test restores to verify backup integrity

1. **Test PostgreSQL Restore**:
   ```bash
   # Create test recovery cluster
   kubectl apply -f test-recovery-cluster.yaml
   
   # Verify data integrity
   ./scripts/backup-verify
   ```

2. **Test Velero Restore**:
   ```bash
   # Create test namespace
   kubectl create namespace recovery-test
   
   # Restore to test namespace
   velero restore create test-restore \
     --from-backup {backup-name} \
     --namespace-mappings keycloak:recovery-test
   ```

### Backup Verification Script

Run automated verification:
```bash
./scripts/backup-verify
```

This script checks:
- PostgreSQL backup configurations
- Velero deployment status
- Backup storage connectivity
- Recent backup status

### Recovery Time Testing

**Quarterly**: Perform full disaster recovery tests

1. **Document Start Time**
2. **Destroy Test Environment**
3. **Execute Recovery Procedures**
4. **Verify Application Functionality**
5. **Document Recovery Time**
6. **Update Procedures Based on Findings**

## Emergency Contacts

### Technical Contacts
- **Primary**: {primary-contact-email}
- **Secondary**: {secondary-contact-email}
- **On-Call**: {on-call-contact}

### Vendor Support
- **DigitalOcean Support**: Via control panel or support tickets
- **GitHub Support**: Via GitHub support portal

### Documentation Updates

This document should be reviewed and updated:
- After any significant infrastructure changes
- Following disaster recovery tests
- When RTO/RPO requirements change
- After actual disaster recovery events

**Last Updated**: {date}
**Next Review**: {next-review-date}
**Document Owner**: {document-owner}