#!/bin/bash
set -e
set -u

echo "Installing GitOps tools..."

# Read tool versions from tool-versions.txt
if [ ! -r tool-versions.txt ]; then
    echo "Error: tool-versions.txt is missing or not readable."
    exit 1
fi
AGE_VERSION=$(grep "^age=" tool-versions.txt | cut -d'=' -f2)
SOPS_VERSION=$(grep "^sops=" tool-versions.txt | cut -d'=' -f2)
YQ_VERSION=$(grep "^yq=" tool-versions.txt | cut -d'=' -f2)
FLUX_VERSION=$(grep "^flux=" tool-versions.txt | cut -d'=' -f2)
GOMPLATE_VERSION=$(grep "^gomplate=" tool-versions.txt | cut -d'=' -f2)
DOCTL_VERSION=$(grep "^doctl=" tool-versions.txt | cut -d'=' -f2)

# Install Age
echo "Installing Age v${AGE_VERSION}..."
mkdir -p /tmp/age
curl -Lo /tmp/age.tar.gz "https://github.com/FiloSottile/age/releases/download/v${AGE_VERSION}/age-v${AGE_VERSION}-linux-amd64.tar.gz"
tar -xzf /tmp/age.tar.gz --strip-components=1 -C /tmp/age
sudo mv /tmp/age/age /usr/local/bin/
sudo mv /tmp/age/age-keygen /usr/local/bin/
rm -rf /tmp/age.tar.gz /tmp/age

# Install SOPS
echo "Installing SOPS v${SOPS_VERSION}..."
curl -Lo /tmp/sops "https://github.com/mozilla/sops/releases/download/v${SOPS_VERSION}/sops-v${SOPS_VERSION}.linux.amd64"
sudo mv /tmp/sops /usr/local/bin/sops
sudo chmod +x /usr/local/bin/sops

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

age --version
sops --version
yq --version
flux version --client
gomplate --version
terraform version
kubectl version --client
doctl version

echo "GitOps environment setup complete!"