#!/usr/bin/env bash

# Template-owned manifests must not retain the source organization's identity.
# Generated upstream dependency bundles are the only intentional exception and
# are allowed only for exact dependency URLs in their known generated files.

set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
MANIFEST_ROOT=${MANIFEST_ROOT:-"$ROOT_DIR/manifests"}

if [ ! -d "$MANIFEST_ROOT" ]; then
  echo "::error::manifest directory does not exist: $MANIFEST_ROOT" >&2
  exit 1
fi

# Keep this list deliberately narrow: generic words such as `example` and
# `company-as-code` are part of the template contract, not source identities.
FORBIDDEN='(^|[^[:alnum:]_-])(happyvertical|willgriffin)([^[:alnum:]_-]|$)'

is_allowed_dependency_identity() {
  local file=$1
  local line=$2

  case "$file" in
    "$MANIFEST_ROOT"/*/flux-system/gotk-components.yaml|\
    "$MANIFEST_ROOT"/*/flux-system/image-components.yaml|\
    "$MANIFEST_ROOT"/*/*/flux-system/gotk-components.yaml|\
    "$MANIFEST_ROOT"/*/*/flux-system/image-components.yaml)
      [[ "$line" =~ (github\.com|ghcr\.io)/happyvertical/ ]]
      ;;
    "$MANIFEST_ROOT"/system/org-as-code-operator/chart-source.yaml)
      [[ "$line" =~ ghcr\.io/willgriffin/charts/org-as-code ]] ||
        [[ "$line" == *'github\.com/willgriffin/org-as-code/\.github/workflows/release\.yaml'* ]]
      ;;
    "$MANIFEST_ROOT"/shared/templates/hermes-agent/placeholder.yaml|\
    "$MANIFEST_ROOT"/tenants/my-tenant/company-services/hermes/agent.yaml|\
    "$MANIFEST_ROOT"/tenants/my-tenant/company-services/hermes/organization.yaml|\
    "$MANIFEST_ROOT"/tenants/my-tenant/company-services/hermes/secrets.secret.template.yaml|\
    "$MANIFEST_ROOT"/tenants/my-tenant/company-services/hermes/workload.yaml)
      [[ "$line" =~ willgriffin\.dev/ ]]
      ;;
    *)
      return 1
      ;;
  esac
}

failures=0
while IFS= read -r file; do
  while IFS= read -r match; do
    line_number=${match%%:*}
    line=${match#*:}
    if is_allowed_dependency_identity "$file" "$line"; then
      continue
    fi
    echo "::error file=$file,line=$line_number::source organization literal in template-owned manifest: $line" >&2
    failures=$((failures + 1))
  done < <(grep -inE "$FORBIDDEN" "$file" || true)
done < <(find "$MANIFEST_ROOT" -type f \( -name '*.yaml' -o -name '*.yml' \) -print | sort)

if [ "$failures" -gt 0 ]; then
  echo "Found $failures source organization literal(s) in template-owned manifests." >&2
  exit 1
fi

echo "No source organization literals found in template-owned manifests."
