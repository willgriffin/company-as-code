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
   - Login to Keycloak admin console
   - Authentication → OTP Policy
   - Configure for all admin users

3. **Monitor access**:
   - Check Keycloak audit logs
   - Review user sessions regularly
   - Set up alerts for failed login attempts