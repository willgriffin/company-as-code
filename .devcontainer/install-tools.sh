#!/bin/bash
set -e
set -u

echo "Installing GitOps tools..."

# Read tool versions from tool-versions.txt
if [ ! -r tool-versions.txt ]; then
    echo "Error: tool-versions.txt is missing or not readable."
    exit 1
fi
YQ_VERSION=$(grep "^yq=" tool-versions.txt | cut -d'=' -f2)
FLUX_VERSION=$(grep "^flux=" tool-versions.txt | cut -d'=' -f2)
GOMPLATE_VERSION=$(grep "^gomplate=" tool-versions.txt | cut -d'=' -f2)
DOCTL_VERSION=$(grep "^doctl=" tool-versions.txt | cut -d'=' -f2)


# Install yq
echo "Installing yq v${YQ_VERSION}..."
curl -Lo /tmp/yq "https://github.com/mikefarah/yq/releases/download/v${YQ_VERSION}/yq_linux_amd64"
sudo mv /tmp/yq /usr/local/bin/yq
sudo chmod +x /usr/local/bin/yq

# Install Flux CLI
echo "Installing Flux CLI v${FLUX_VERSION}..."
curl -s https://fluxcd.io/install.sh | sudo FLUX_VERSION="${FLUX_VERSION}" bash
sudo chmod +x /usr/local/bin/flux

# Install gomplate
echo "Installing gomplate v${GOMPLATE_VERSION}..."
curl -Lo /tmp/gomplate "https://github.com/hairyhenderson/gomplate/releases/download/v${GOMPLATE_VERSION}/gomplate_linux-amd64"
sudo mv /tmp/gomplate /usr/local/bin/gomplate
sudo chmod +x /usr/local/bin/gomplate

# Install doctl
echo "Installing doctl v${DOCTL_VERSION}..."
curl -sL "https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-amd64.tar.gz" | tar -xzv
sudo mv doctl /usr/local/bin/
rm -f doctl-*

echo "All tools installed successfully!"
echo "Verifying installations..."

yq --version
flux version --client
gomplate --version
terraform version
kubectl version --client
doctl version

echo "GitOps environment setup complete!"

# Install Node.js dependencies for development
echo "Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        echo "Warning: pnpm not found, skipping dependency installation"
    fi
fi

# Create bash alias for claude
echo "alias claude='npx @anthropic-ai/claude-code'" >> ~/.bashrc

# Setup kubeconfig for codespace if cluster exists
if [ -n "${CODESPACES:-}" ] && [ -n "${DIGITALOCEAN_TOKEN:-}" ]; then
    echo "Setting up kubeconfig for codespace..."
    
    # Authenticate with DigitalOcean
    doctl auth init --access-token "$DIGITALOCEAN_TOKEN" >/dev/null 2>&1
    
    # Check if cluster exists and get kubeconfig
    if doctl kubernetes cluster list --no-header 2>/dev/null | grep -q "running"; then
        # Unset the malformed KUBECONFIG environment variable
        unset KUBECONFIG
        
        # Get the first running cluster and save its kubeconfig
        CLUSTER_NAME=$(doctl kubernetes cluster list --format Name,Status --no-header | grep running | head -n1 | cut -d' ' -f1)
        if [ -n "$CLUSTER_NAME" ]; then
            echo "Found running cluster: $CLUSTER_NAME"
            doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME" >/dev/null 2>&1
            
            # Set proper KUBECONFIG environment variable for the session
            export KUBECONFIG="$HOME/.kube/config"
            echo "export KUBECONFIG=\"$HOME/.kube/config\"" >> ~/.bashrc
            
            echo "✓ Kubeconfig configured successfully"
            echo "✓ kubectl is ready to use"
        else
            echo "⚠ No running cluster found"
        fi
    else
        echo "⚠ No clusters found or cluster not yet deployed"
    fi
fi

echo "Development environment ready!"