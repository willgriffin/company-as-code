#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Admin Credentials Retrieval ===${NC}"
echo

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}Cannot connect to Kubernetes cluster. Please check your kubeconfig.${NC}"
    exit 1
fi

# Check if template variables have been replaced
if [[ "{{SETUP_REPO_DOMAIN}}" == *"{{"* ]]; then
    echo -e "${RED}Error: Template variables not replaced. Please run the setup script first.${NC}"
    exit 1
fi

# Wait for password generation job if it exists and hasn't completed
echo -e "${BLUE}Checking password generation status...${NC}"
if kubectl get job generate-initial-secrets -n digitalocean-secrets &> /dev/null; then
    if ! kubectl wait --for=condition=complete job/generate-initial-secrets -n digitalocean-secrets --timeout=300s 2>/dev/null; then
        echo -e "${YELLOW}Password generation job hasn't completed yet.${NC}"
        echo -e "${YELLOW}The job may still be running. Please wait and try again in a few minutes.${NC}"
        echo
        echo "You can check the job status with:"
        echo "  kubectl get job generate-initial-secrets -n digitalocean-secrets"
        echo "  kubectl logs job/generate-initial-secrets -n digitalocean-secrets"
        exit 1
    fi
fi

# Retrieve credentials
echo -e "${BLUE}Retrieving admin credentials...${NC}"
echo

# Get admin username (email)
ADMIN_USERNAME=$(kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.admin-username}' 2>/dev/null | base64 -d) || true
if [[ -z "$ADMIN_USERNAME" ]]; then
    echo -e "${YELLOW}Admin username not found in secret. It may be set to the email from setup.${NC}"
else
    echo -e "${GREEN}Admin Username:${NC} $ADMIN_USERNAME"
fi

# Get admin password
ADMIN_PASSWORD=$(kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.admin-password}' 2>/dev/null | base64 -d) || true
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo -e "${YELLOW}Admin password not found. The secret generation job may not have run yet.${NC}"
    echo -e "${YELLOW}Check if the generate-initial-secrets job has completed:${NC}"
    echo -e "  kubectl get jobs -n digitalocean-secrets"
else
    echo -e "${GREEN}Admin Password:${NC} $ADMIN_PASSWORD"
fi

# Get Keycloak URL
echo
echo -e "${BLUE}Keycloak Login URL:${NC} https://auth.{{SETUP_REPO_DOMAIN}}"
echo
echo -e "${YELLOW}Note: Save these credentials securely. The password is randomly generated on first deployment.${NC}"

# Optional: Get other application passwords
echo
read -p "Show other application passwords? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo
    echo -e "${BLUE}Other Application Passwords:${NC}"
    
    NEXTCLOUD_PASS=$(kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.nextcloud-admin-password}' 2>/dev/null | base64 -d) || true
    [[ -n "$NEXTCLOUD_PASS" ]] && echo -e "${GREEN}Nextcloud Admin:${NC} $NEXTCLOUD_PASS"
    
    GRAFANA_PASS=$(kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.grafana-admin-password}' 2>/dev/null | base64 -d) || true
    [[ -n "$GRAFANA_PASS" ]] && echo -e "${GREEN}Grafana Admin:${NC} $GRAFANA_PASS"
    
    MATTERMOST_PASS=$(kubectl get secret digitalocean-credentials -n digitalocean-secrets -o jsonpath='{.data.mattermost-admin-password}' 2>/dev/null | base64 -d) || true
    [[ -n "$MATTERMOST_PASS" ]] && echo -e "${GREEN}Mattermost Admin:${NC} $MATTERMOST_PASS"
fi