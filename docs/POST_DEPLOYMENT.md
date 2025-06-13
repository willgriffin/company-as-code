# Post-Deployment Guide

## 🔐 Retrieving Admin Credentials

After your cluster is deployed, the admin password is automatically generated and stored securely in Kubernetes secrets.

### Quick Password Retrieval

```bash
# Run the convenience script
./scripts/get-admin-password.sh

# Or use kubectl directly
kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.admin-password}' | base64 -d
```

### Manual Steps

1. **Ensure you have kubectl access to your cluster**:
   ```bash
   export KUBECONFIG=~/.kube/config
   kubectl cluster-info
   ```

2. **Retrieve the admin password**:
   ```bash
   # Get admin password
   kubectl get secret digitalocean-credentials \
     -n digitalocean-secrets \
     -o jsonpath='{.data.admin-password}' | base64 -d
   
   # Get admin username (should be your email)
   kubectl get secret digitalocean-credentials \
     -n digitalocean-secrets \
     -o jsonpath='{.data.admin-username}' | base64 -d
   ```

3. **Login to Keycloak**:
   - URL: `https://auth.{{SETUP_REPO_DOMAIN}}`
   - Username: Your admin email from setup
   - Password: Retrieved from the secret

### Other Application Passwords

All application passwords are stored in the same secret:

```bash
# Nextcloud admin password
kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.nextcloud-admin-password}' | base64 -d

# Grafana admin password
kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.grafana-admin-password}' | base64 -d

# Mattermost admin password
kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.mattermost-admin-password}' | base64 -d
```

## 🔄 Password Rotation

To rotate passwords:

1. **Update the secret with a new password**:
   ```bash
   # Generate a new password
   NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
   
   # Update the secret
   kubectl patch secret digitalocean-credentials \
     -n digitalocean-secrets \
     --type='json' \
     -p='[{"op": "replace", "path": "/data/admin-password", "value": "'$(echo -n $NEW_PASSWORD | base64)'"}]'
   ```

2. **Update Keycloak user** (if needed):
   - Login to Keycloak admin console
   - Navigate to Users → admin user
   - Reset password

## 📝 First Login Steps

1. **Access Keycloak Admin Console**:
   - Navigate to `https://auth.{{SETUP_REPO_DOMAIN}}/admin`
   - Login with retrieved credentials
   - Change password if desired

2. **Create Additional Users**:
   - In Keycloak: Manage → Users → Add User
   - Assign to appropriate groups (Administrators, Users, or Viewers)

3. **Configure Applications**:
   - Each application (Nextcloud, Mattermost, etc.) uses Keycloak SSO
   - Users can login with their Keycloak credentials

## 🛡️ Security Best Practices

1. **Store the admin password securely**:
   - Use a password manager
   - Never commit passwords to Git
   - Rotate passwords regularly

2. **Enable 2FA in Keycloak**:
   
   **Via Admin Console**:
   - Login to Keycloak admin console at `https://auth.{{SETUP_REPO_DOMAIN}}/admin`
   - Navigate to: Authentication → Policies → OTP Policy
   - Configure settings:
     - OTP Type: `totp` (Time-based)
     - OTP Hash Algorithm: `SHA256`
     - Number of Digits: `6`
     - Look Ahead Window: `1`
     - OTP Token Period: `30`
   - Save the policy
   
   **Enforce 2FA for Admin Users**:
   - Go to: Authentication → Required Actions
   - Enable "Configure OTP" as default action
   - For existing admin users: Users → Select user → Required User Actions → Add "Configure OTP"
   
   **Programmatic 2FA Setup** (via kubectl):
   ```bash
   # Create OTP required action for realm
   kubectl apply -f - <<EOF
   apiVersion: k8s.keycloak.org/v2alpha1
   kind: KeycloakRealmImport
   metadata:
     name: otp-policy-update
     namespace: keycloak
   spec:
     keycloakCRName: keycloak
     realm:
       realm: {{SETUP_REPO_KEYCLOAK_REALM}}
       otpPolicyType: totp
       otpPolicyAlgorithm: HmacSHA256
       otpPolicyInitialCounter: 0
       otpPolicyDigits: 6
       otpPolicyLookAheadWindow: 1
       otpPolicyPeriod: 30
       requiredActions:
       - alias: CONFIGURE_TOTP
         name: Configure OTP
         providerId: CONFIGURE_TOTP
         enabled: true
         defaultAction: true
         priority: 10
         config: {}
   EOF
   ```

3. **Monitor access**:
   - Check Keycloak audit logs: Admin Console → Events → Login Events
   - Review user sessions: Admin Console → Sessions → Realm sessions
   - Set up alerts for failed login attempts (see Troubleshooting section)

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Password Generation Job Not Completing
**Problem**: The `generate-initial-secrets` job stays in pending or fails.

**Solution**:
```bash
# Check job status
kubectl get jobs -n digitalocean-secrets
kubectl describe job generate-initial-secrets -n digitalocean-secrets

# Check pod logs
kubectl logs -n digitalocean-secrets -l job-name=generate-initial-secrets

# If job failed, delete and let it recreate
kubectl delete job generate-initial-secrets -n digitalocean-secrets

# Force reconciliation
flux reconcile kustomization infrastructure --with-source
```

#### 2. Cannot Retrieve Admin Password
**Problem**: Script returns empty or error when retrieving password.

**Solution**:
```bash
# Check if secret exists
kubectl get secret digitalocean-credentials -n digitalocean-secrets

# Check secret contents (base64 encoded)
kubectl get secret digitalocean-credentials -n digitalocean-secrets -o yaml

# Manually decode specific field
kubectl get secret digitalocean-credentials -n digitalocean-secrets \
  -o jsonpath='{.data.admin-password}' | base64 -d
```

#### 3. Keycloak Login Fails
**Problem**: Cannot login to Keycloak with admin credentials.

**Solution**:
```bash
# Check Keycloak pod status
kubectl get pods -n keycloak

# Check Keycloak logs
kubectl logs -n keycloak -l app.kubernetes.io/name=keycloak

# Verify realm was imported
kubectl get keycloakrealmimports -n keycloak

# Check admin user creation
kubectl get keycloakusers -n keycloak
```

#### 4. User Creation Timing Issues
**Problem**: KeycloakUser resources fail with "realm not found" errors.

**Solution**:
```bash
# Check realm status
kubectl describe keycloakrealmimport {{SETUP_REPO_KEYCLOAK_REALM}}-realm -n keycloak

# Manually trigger user reconciliation after realm is ready
kubectl annotate keycloakuser admin-user -n keycloak \
  reconcile.keycloak.org/trigger="$(date +%s)" --overwrite

# Check user creation logs
kubectl logs -n keycloak -l app.kubernetes.io/name=keycloak-operator
```

#### 5. External Secrets Not Syncing
**Problem**: Passwords not being generated or synced.

**Solution**:
```bash
# Check ExternalSecrets operator
kubectl get pods -n external-secrets

# Check ClusterSecretStore status
kubectl describe clustersecretstore cluster-secret-store

# Check ExternalSecret status
kubectl describe externalsecret -n keycloak

# Force refresh
kubectl annotate externalsecret admin-credentials -n keycloak \
  force-sync="$(date +%s)" --overwrite
```

### Setting Up Login Failure Alerts

To monitor failed login attempts, configure Keycloak event listeners:

1. **Enable Event Logging**:
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: k8s.keycloak.org/v2alpha1
   kind: KeycloakRealmImport
   metadata:
     name: enable-events
     namespace: keycloak
   spec:
     keycloakCRName: keycloak
     realm:
       realm: {{SETUP_REPO_KEYCLOAK_REALM}}
       eventsEnabled: true
       eventsExpiration: 604800  # 7 days
       eventsListeners:
       - jboss-logging
       enabledEventTypes:
       - LOGIN_ERROR
       - LOGIN
       - LOGOUT
       - REGISTER_ERROR
       adminEventsEnabled: true
       adminEventsDetailsEnabled: true
   EOF
   ```

2. **Monitor Events via API**:
   ```bash
   # Get Keycloak admin token
   TOKEN=$(curl -s -X POST \
     "https://auth.{{SETUP_REPO_DOMAIN}}/realms/master/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=$(./scripts/get-admin-password.sh | grep 'Admin Password:' | cut -d' ' -f3)&grant_type=password&client_id=admin-cli" \
     | jq -r '.access_token')
   
   # Query login failure events
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://auth.{{SETUP_REPO_DOMAIN}}/admin/realms/{{SETUP_REPO_KEYCLOAK_REALM}}/events?type=LOGIN_ERROR" \
     | jq '.'
   ```

### Backup and Restore

#### Backup User Data
```bash
# Export realm configuration (includes users)
kubectl exec -n keycloak deployment/keycloak -- \
  /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm {{SETUP_REPO_KEYCLOAK_REALM}}

# Copy export to local machine
kubectl cp keycloak/$(kubectl get pod -n keycloak -l app.kubernetes.io/name=keycloak -o jsonpath='{.items[0].metadata.name}'):/tmp/export ./keycloak-backup
```

#### Restore User Data
```bash
# Copy backup to pod
kubectl cp ./keycloak-backup keycloak/$(kubectl get pod -n keycloak -l app.kubernetes.io/name=keycloak -o jsonpath='{.items[0].metadata.name}'):/tmp/import

# Import realm data
kubectl exec -n keycloak deployment/keycloak -- \
  /opt/keycloak/bin/kc.sh import \
  --dir /tmp/import \
  --override true
```