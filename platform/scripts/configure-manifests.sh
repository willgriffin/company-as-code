#!/bin/bash
set -euo pipefail

# Configure static manifests script
# This script performs find-and-replace operations on Kubernetes manifests
# to replace template values with actual configuration

MANIFESTS_DIR="${1:-../manifests}"
REPLACEMENTS_FILE="${2:-/tmp/replacements.json}"

echo "🔧 Configuring static manifests..."
echo "📁 Manifests directory: $MANIFESTS_DIR"
echo "🔄 Replacements file: $REPLACEMENTS_FILE"

# Check if manifests directory exists
if [[ ! -d "$MANIFESTS_DIR" ]]; then
  echo "⚠️  Warning: Manifests directory not found at $MANIFESTS_DIR"
  exit 0
fi

# Check if replacements file exists
if [[ ! -f "$REPLACEMENTS_FILE" ]]; then
  echo "❌ Error: Replacements file not found at $REPLACEMENTS_FILE"
  exit 1
fi

# Check if replacements have already been applied
if [[ -f "$MANIFESTS_DIR/.replacements-applied" ]]; then
  echo "✅ Replacements have already been applied, skipping..."
  echo "ℹ️  To reapply, delete $MANIFESTS_DIR/.replacements-applied"
  exit 0
fi

# Create backup directory if it doesn't exist
echo "💾 Creating backup of original manifests..."
if [[ ! -d "$MANIFESTS_DIR/.backups" ]]; then
  mkdir -p "$MANIFESTS_DIR/.backups"
  
  # Backup all YAML files
  find "$MANIFESTS_DIR" -name "*.yaml" -o -name "*.yml" | while read -r file; do
    relative_path="${file#$MANIFESTS_DIR/}"
    backup_dir="$MANIFESTS_DIR/.backups/$(dirname "$relative_path")"
    mkdir -p "$backup_dir"
    cp "$file" "$MANIFESTS_DIR/.backups/$relative_path.orig"
  done
  
  echo "✅ Backup created in $MANIFESTS_DIR/.backups"
else
  echo "ℹ️  Backup directory already exists, skipping backup creation"
fi

# Read replacements from JSON file and apply them
echo "🔄 Applying configuration replacements..."

# Use jq to parse JSON and apply replacements
# Sort by string length (descending) to handle overlapping patterns correctly
jq -r 'to_entries | sort_by(.key | length) | reverse | .[] | "\(.key)|\(.value)"' "$REPLACEMENTS_FILE" | while IFS='|' read -r from to; do
  if [[ -n "$from" && -n "$to" ]]; then
    echo "  🔄 Replacing: $from → $to"
    
    # Escape special characters for sed
    escaped_from=$(printf '%s\n' "$from" | sed 's/[[\.*^$()+?{|]/\\&/g')
    escaped_to=$(printf '%s\n' "$to" | sed 's/[[\.*^$(){}|]/\\&/g; s/&/\\&/g')
    
    # Apply replacement to all YAML files
    find "$MANIFESTS_DIR" -name "*.yaml" -o -name "*.yml" | xargs sed -i "s|$escaped_from|$escaped_to|g"
  fi
done

# Verification step (non-blocking)
echo "🔍 Verifying replacement completeness..."
remaining_examples=$(find "$MANIFESTS_DIR" -name "*.yaml" -o -name "*.yml" | xargs grep -l "example" 2>/dev/null | wc -l || echo "0")

if [ "$remaining_examples" -gt 0 ]; then
  echo "⚠️  Warning: $remaining_examples files still contain 'example' patterns:"
  find "$MANIFESTS_DIR" -name "*.yaml" -o -name "*.yml" | xargs grep -l "example" 2>/dev/null || true
  echo "🔍 Specific patterns found:"
  find "$MANIFESTS_DIR" -name "*.yaml" -o -name "*.yml" | xargs grep -o '[a-zA-Z0-9.-]*example[a-zA-Z0-9.-]*' 2>/dev/null | sort | uniq || true
  echo "ℹ️  Note: Some example patterns may be intentional (like in comments or documentation)"
else
  echo "✅ All example patterns successfully replaced"
fi

echo "🎉 Static manifest configuration complete"

# Mark as completed
touch "$MANIFESTS_DIR/.replacements-applied"
echo "✅ Created marker file: $MANIFESTS_DIR/.replacements-applied"