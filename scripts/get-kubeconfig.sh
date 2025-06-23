#!/usr/bin/env bash
set -euo pipefail

# Get kubeconfig for local development using doctl
# Note: In GitHub Codespaces, KUBECONFIG is automatically available as an environment variable
# This script is primarily for local development scenarios where doctl authentication is available

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DEFAULT_CLUSTER_NAME="{{SETUP_REPO_CLUSTER_NAME}}"
KUBE_DIR="$HOME/.kube"
BACKUP_SUFFIX=".backup-$(date +%Y%m%d-%H%M%S)"

# Check if template variables have been replaced
if [[ "$DEFAULT_CLUSTER_NAME" == *"{{"* ]]; then
    echo -e "${RED}Error: Template variables not replaced. Please run the setup script first.${NC}"
    echo -e "${RED}This script contains unprocessed template variables.${NC}"
    exit 1
fi

echo -e "${BLUE}=== DigitalOcean Kubernetes Config Setup ===${NC}"
echo

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -c, --cluster NAME    Cluster name (default: $DEFAULT_CLUSTER_NAME)"
    echo "  -f, --file FILE       Custom config file path (default: ~/.kube/config)"
    echo "  -m, --merge           Merge with existing kubeconfig"
    echo "  -b, --backup          Backup existing config before overwriting"
    echo "  -h, --help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    # Get config for default cluster"
    echo "  $0 -c production      # Get config for 'production' cluster"
    echo "  $0 -m -b              # Merge with existing config, creating backup"
    exit 1
}

# Parse command line arguments
CLUSTER_NAME="$DEFAULT_CLUSTER_NAME"
CONFIG_FILE="$KUBE_DIR/config"
MERGE=false
BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--cluster)
            CLUSTER_NAME="$2"
            shift 2
            ;;
        -f|--file)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -m|--merge)
            MERGE=true
            shift
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}Error: doctl is not installed${NC}"
    echo "Please install doctl first:"
    echo "  brew install doctl     # macOS"
    echo "  snap install doctl     # Ubuntu/Debian" 
    echo "  nix-shell -p doctl     # NixOS"
    echo
    echo "Or download from: https://github.com/digitalocean/doctl/releases"
    exit 1
fi

# Check if authenticated with DigitalOcean
if ! doctl account get &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with DigitalOcean${NC}"
    echo "Please run: doctl auth init"
    echo "You'll need your DigitalOcean API token from:"
    echo "  https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

# Create ~/.kube directory if it doesn't exist
if [[ ! -d "$KUBE_DIR" ]]; then
    echo -e "${BLUE}Creating $KUBE_DIR directory...${NC}"
    mkdir -p "$KUBE_DIR"
    chmod 700 "$KUBE_DIR"
fi

# Backup existing config if requested
if [[ -f "$CONFIG_FILE" ]] && [[ "$BACKUP" == "true" ]]; then
    BACKUP_FILE="${CONFIG_FILE}${BACKUP_SUFFIX}"
    echo -e "${BLUE}Backing up existing config to: $BACKUP_FILE${NC}"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# Check if cluster exists
echo -e "${BLUE}Checking for cluster: $CLUSTER_NAME${NC}"
if ! doctl kubernetes cluster get "$CLUSTER_NAME" &> /dev/null; then
    echo -e "${RED}Error: Cluster '$CLUSTER_NAME' not found${NC}"
    echo
    echo "Available clusters:"
    doctl kubernetes cluster list
    exit 1
fi

# Get cluster ID for additional info
CLUSTER_ID=$(doctl kubernetes cluster get "$CLUSTER_NAME" --format ID --no-header)
CLUSTER_REGION=$(doctl kubernetes cluster get "$CLUSTER_NAME" --format Region --no-header)
CLUSTER_VERSION=$(doctl kubernetes cluster get "$CLUSTER_NAME" --format Version --no-header)
CLUSTER_STATUS=$(doctl kubernetes cluster get "$CLUSTER_NAME" --format Status --no-header)

echo -e "${GREEN}Found cluster:${NC}"
echo "  Name: $CLUSTER_NAME"
echo "  ID: $CLUSTER_ID"
echo "  Region: $CLUSTER_REGION"
echo "  Version: $CLUSTER_VERSION"
echo "  Status: $CLUSTER_STATUS"
echo

# Check cluster status
if [[ "$CLUSTER_STATUS" != "running" ]]; then
    echo -e "${YELLOW}Warning: Cluster is not in 'running' state (current: $CLUSTER_STATUS)${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Save or merge kubeconfig
if [[ "$MERGE" == "true" ]] && [[ -f "$CONFIG_FILE" ]]; then
    echo -e "${BLUE}Merging kubeconfig...${NC}"
    TEMP_CONFIG=$(mktemp)
    doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME" --file "$TEMP_CONFIG"
    
    # Set KUBECONFIG to both files for merging
    export KUBECONFIG="$CONFIG_FILE:$TEMP_CONFIG"
    kubectl config view --flatten > "${CONFIG_FILE}.new"
    mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
    rm "$TEMP_CONFIG"
    
    echo -e "${GREEN}✓ Kubeconfig merged successfully${NC}"
else
    echo -e "${BLUE}Saving kubeconfig...${NC}"
    if [[ "$CONFIG_FILE" == "$KUBE_DIR/config" ]]; then
        # Use doctl's default behavior for ~/.kube/config
        doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME"
    else
        # Save to custom location
        doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME" --file "$CONFIG_FILE"
    fi
    echo -e "${GREEN}✓ Kubeconfig saved successfully${NC}"
fi

# Set proper permissions
chmod 600 "$CONFIG_FILE"

# Set current context
CONTEXT_NAME="do-$CLUSTER_REGION-$CLUSTER_NAME"
kubectl config use-context "$CONTEXT_NAME" &> /dev/null || true

# Test connection
echo
echo -e "${BLUE}Testing connection...${NC}"
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✓ Successfully connected to cluster${NC}"
    echo
    kubectl cluster-info
    echo
    echo -e "${GREEN}Cluster nodes:${NC}"
    kubectl get nodes
else
    echo -e "${RED}✗ Failed to connect to cluster${NC}"
    echo "Please check your connection and try again"
    exit 1
fi

echo
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo
echo "You can now use kubectl to interact with your cluster:"
echo "  kubectl get pods --all-namespaces"
echo "  kubectl get nodes"
echo
echo "To switch between contexts (if you have multiple clusters):"
echo "  kubectl config get-contexts"
echo "  kubectl config use-context $CONTEXT_NAME"
echo
echo "To get admin password for applications:"
echo "  ./scripts/get-admin-password.sh"