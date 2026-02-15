#!/usr/bin/env bash
set -euo pipefail

# Template Reset Script
# Converts production repository back to template with distinctive placeholders

echo "🔄 Resetting repository to template state with distinctive placeholders..."

# Define placeholder patterns
PROJECT_PLACEHOLDER="TEMPLATE_PROJECT_NAME_PLACEHOLDER"
DOMAIN_PLACEHOLDER="TEMPLATE_DOMAIN_PLACEHOLDER"
EMAIL_PLACEHOLDER="TEMPLATE_EMAIL_PLACEHOLDER"
CLUSTER_PLACEHOLDER="${PROJECT_PLACEHOLDER}-production"

echo "📝 Replacing hardcoded values with placeholders..."

# Replace project names, domains, and emails in all relevant files
find . -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.ts" -o -name "*.json" -o -name "*.sh" \) \
  ! -path "./.git/*" \
  ! -path "./node_modules/*" \
  ! -path "./platform/node_modules/*" \
  ! -path "./platform/dist/*" \
  ! -path "./.cdktf/*" \
  -exec sed -i "s/happyvertical-production/${CLUSTER_PLACEHOLDER}/g" {} + \
  -exec sed -i "s/happyvertical\.com/${DOMAIN_PLACEHOLDER}/g" {} + \
  -exec sed -i "s/happyvertical/${PROJECT_PLACEHOLDER}/g" {} + \
  -exec sed -i "s/willgriffin@gmail\.com/${EMAIL_PLACEHOLDER}/g" {} +

echo "📁 Renaming cluster directory..."
# Rename cluster directory if it exists
if [[ -d "manifests/clusters/happyvertical-production" ]]; then
  mv "manifests/clusters/happyvertical-production" "manifests/clusters/${CLUSTER_PLACEHOLDER}"
elif [[ -d "manifests/clusters/${PROJECT_PLACEHOLDER}-production" ]]; then
  mv "manifests/clusters/${PROJECT_PLACEHOLDER}-production" "manifests/clusters/${CLUSTER_PLACEHOLDER}"
fi

echo "⚙️ Updating configuration files..."

# Update platform config.json to use placeholders
if [[ -f "platform/config.json" ]]; then
  cat > platform/config.json << EOF
{
  "project": {
    "name": "${PROJECT_PLACEHOLDER}",
    "domain": "${DOMAIN_PLACEHOLDER}",
    "email": "${EMAIL_PLACEHOLDER}",
    "description": "${PROJECT_PLACEHOLDER} as code"
  },
  "environments": [
    {
      "name": "production",
      "cluster": {
        "region": "nyc3",
        "nodeSize": "s-2vcpu-4gb",
        "nodeCount": 3,
        "minNodes": 2,
        "maxNodes": 5,
        "haControlPlane": false
      },
      "domain": "${DOMAIN_PLACEHOLDER}"
    }
  ]
}
EOF
fi

# Update config.json.example to use placeholders  
if [[ -f "platform/config.json.example" ]]; then
  cat > platform/config.json.example << EOF
{
  "project": {
    "name": "${PROJECT_PLACEHOLDER}",
    "domain": "${DOMAIN_PLACEHOLDER}",
    "email": "${EMAIL_PLACEHOLDER}",
    "description": "${PROJECT_PLACEHOLDER} as code"
  },
  "environments": [
    {
      "name": "production",
      "cluster": {
        "region": "nyc3",
        "nodeSize": "s-2vcpu-4gb",
        "nodeCount": 3,
        "minNodes": 2,
        "maxNodes": 5,
        "haControlPlane": true,
        "version": "1.31.0-do.0"
      },
      "domain": "${DOMAIN_PLACEHOLDER}"
    }
  ]
}
EOF
fi

echo "🛠️ Updating scripts..."

# Update get-kubeconfig.sh default cluster name
if [[ -f "scripts/get-kubeconfig.sh" ]]; then
  sed -i "s/DEFAULT_CLUSTER_NAME=\".*\"/DEFAULT_CLUSTER_NAME=\"${CLUSTER_PLACEHOLDER}\"/" scripts/get-kubeconfig.sh
fi

echo "📚 Updating documentation..."

# Update README to be template-focused (if needed)
if [[ -f "README.md" ]]; then
  # The README should already be template-focused, but ensure any hardcoded references are replaced
  sed -i "s/happyvertical/${PROJECT_PLACEHOLDER}/g" README.md
  sed -i "s/happyvertical\.com/${DOMAIN_PLACEHOLDER}/g" README.md
fi

echo "🔍 Searching for any remaining hardcoded values..."

# Check for any remaining hardcoded values that might have been missed
echo "Checking for remaining 'happyvertical' references..."
if grep -r "happyvertical" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null | grep -v "${PROJECT_PLACEHOLDER}" || true; then
  echo "⚠️  Found some remaining 'happyvertical' references above (may be in comments or docs)"
fi

echo "Checking for remaining 'willgriffin@gmail.com' references..."
if grep -r "willgriffin@gmail.com" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null | grep -v "${EMAIL_PLACEHOLDER}" || true; then
  echo "⚠️  Found some remaining email references above"
fi

echo "🧹 Cleaning up build artifacts..."

# Remove any build artifacts or temporary files
rm -rf platform/dist platform/node_modules node_modules .cdktf terraform.tfstate* *.log || true

echo "✅ Template reset complete!"
echo ""
echo "📋 Summary of placeholders used:"
echo "  Project name: ${PROJECT_PLACEHOLDER}"
echo "  Domain:       ${DOMAIN_PLACEHOLDER}"  
echo "  Email:        ${EMAIL_PLACEHOLDER}"
echo "  Cluster:      ${CLUSTER_PLACEHOLDER}"
echo ""
echo "🔍 Review the changes and run:"
echo "  git add -A"
echo "  git commit -m 'feat: comprehensive production improvements with template reset'"
echo "  git push"