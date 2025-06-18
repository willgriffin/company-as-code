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
curl -s https://fluxcd.io/install.sh | sudo bash -s -- --version="${FLUX_VERSION}"

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
if [ -f "package.json" ]; then
    npm install
fi

if [ -f "platform/package.json" ]; then
    cd platform && npm install && cd ..
fi

echo "Development environment ready!"