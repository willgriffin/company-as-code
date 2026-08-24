#!/usr/bin/env bash

# Reject deployable Kubernetes Secrets unless they are explicitly templates or
# SOPS-encrypted files.  Filename conventions are useful, but the SOPS marker
# is also checked so a correctly encrypted file may use another name.

set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
MANIFEST_ROOT=${MANIFEST_ROOT:-"$ROOT_DIR/manifests"}

if ! command -v yq >/dev/null 2>&1; then
  echo "::error::yq is required to inspect Kubernetes Secret manifests" >&2
  exit 1
fi
if [ ! -d "$MANIFEST_ROOT" ]; then
  echo "::error::manifest directory does not exist: $MANIFEST_ROOT" >&2
  exit 1
fi

is_secret_manifest() {
  yq -e 'select(.kind == "Secret")' "$1" >/dev/null 2>&1
}

is_sops_encrypted() {
  grep -qE '^[[:space:]]*sops:' "$1" && grep -q 'ENC\[AES256_GCM' "$1"
}

failures=0
while IFS= read -r file; do
  is_secret_manifest "$file" || continue

  case "$file" in
    *.secret.template.yaml) continue ;;
  esac
  if is_sops_encrypted "$file"; then
    continue
  fi

  echo "::error file=$file::Plaintext Kubernetes Secret; use *.secret.template.yaml or a SOPS-encrypted file" >&2
  failures=$((failures + 1))
done < <(find "$MANIFEST_ROOT" -type f \( -name '*.yaml' -o -name '*.yml' \) -print | sort)

if [ "$failures" -gt 0 ]; then
  echo "Found $failures plaintext Kubernetes Secret manifest(s)." >&2
  exit 1
fi

echo "No plaintext Kubernetes Secret manifests found."
